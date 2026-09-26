// Service Worker。
//
// 目的:
//   1. PWA インストール要件の充足
//   2. 静的アセット（/_next/static 配下）のキャッシュによる起動高速化
//   3. オフライン時に「最後に見た画面」を表示できるようにする
//   4. 将来の Web Push の受け皿
//
// 【方針変更の記録】以前はキャッシュを一切持たない最小実装だった（依存を増やさず
// next-pwa/Workbox も不採用という判断）。ただし旧 Vue(SSG)+Workbox 版では圏外でも
// アプリの殻が起動していたのに対し、SSR 移行後は圏外だとブラウザのエラー画面に
// なる退行があった。家計簿は電車内・レジ前で開くため、この退行は許容しないと判断し
// fetch ハンドラを追加した。Workbox は引き続き使わず、必要な分だけ自前で書く。
//
// 【キャッシュ戦略】
//   - /_next/static/**  : cache-first。ビルドハッシュが URL に入るため同一 URL の
//                         内容が変わることがなく、安全に永続キャッシュできる。
//   - ナビゲーション     : network-first。成功時のみキャッシュを更新し、オフライン時
//                         だけキャッシュへフォールバックする。家計簿は金額を扱うため
//                         オンラインで古い残高を見せることは絶対に避ける。
//   - それ以外の GET     : 素通し。
//   - GET 以外（POST 等）: 一切介入しない。Server Action をキャッシュ/リトライすると
//                          二重登録の温床になるため、必ずネットワークへ素通しし、
//                          オフライン時はそのまま失敗させる（UI 側でトースト表示）。

const STATIC_CACHE = 'kakeyo-static-v1';
const PAGE_CACHE = 'kakeyo-pages-v1';
const CURRENT_CACHES = [STATIC_CACHE, PAGE_CACHE];

// オフラインでキャッシュから返したレスポンスに付ける印。
// クライアントはこのヘッダでオフライン表示の判断ができる。
const STALE_HEADER = 'x-kakeyo-stale';

// インストール直後に待機を飛ばして即 activate させる。
self.addEventListener('install', () => {
  self.skipWaiting();
});

// activate 時に既存クライアントを即時制御下に置き、古い世代のキャッシュを捨てる。
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith('kakeyo-') && !CURRENT_CACHES.includes(key))
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // GET 以外は介入しない（Server Action の POST を含む）。
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // 別オリジン（Supabase API 等）は扱わない。認証トークン付きの応答を
  // 取り違えてキャッシュする事故を避ける。
  if (url.origin !== self.location.origin) {
    return;
  }

  // ビルドハッシュ付き静的アセットは cache-first。
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // 画面遷移（アドレスバーからの遷移・PWA 起動）は network-first。
  if (request.mode === 'navigate') {
    event.respondWith(navigationNetworkFirst(request));
  }

  // それ以外の GET（RSC ペイロード・画像・API 等）は素通し。
  // RSC を握ると Router Cache と二重管理になり、古い金額を混ぜる危険がある。
});

// ハッシュ付きアセット専用。あればキャッシュを返し、無ければ取得して保存する。
async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) {
    return cached;
  }

  const response = await fetch(request);
  if (response.ok) {
    cache.put(request, response.clone());
  }
  return response;
}

// ナビゲーション専用。オンラインなら必ずネットワークを優先し、
// 取得できた時だけキャッシュを更新する。失敗時のみキャッシュを返す。
async function navigationNetworkFirst(request) {
  const cache = await caches.open(PAGE_CACHE);

  try {
    const response = await fetch(request);
    if (response.ok) {
      // 保存は待たずに進める（描画を遅らせない）。
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // ここに来るのは基本的にオフライン。まず同一 URL、無ければ
    // 直近に見た任意の画面を返し、最低限アプリの殻を立ち上げる。
    const cached = (await cache.match(request)) || (await matchAnyPage(cache));
    if (cached) {
      return withStaleHeader(cached);
    }
    // 一度も開いたことがない場合は素の失敗に任せる。
    throw new Error('offline and no cached page available');
  }
}

// キャッシュ済みページのうち最初に見つかったものを返す（起動時のフォールバック用）。
async function matchAnyPage(cache) {
  const keys = await cache.keys();
  if (keys.length === 0) {
    return undefined;
  }
  return cache.match(keys[0]);
}

// キャッシュ由来であることを示すヘッダを足して返す。
// Response のヘッダは immutable なので作り直す。
async function withStaleHeader(response) {
  const body = await response.blob();
  const headers = new Headers(response.headers);
  headers.set(STALE_HEADER, '1');
  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

// --- 以下は将来の Web Push（VAPID）用の骨組み。今は最小実装のみ ---

// プッシュ受信時に通知を表示する。ペイロードが無い/壊れている場合も落ちないようにする。
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : '' };
  }

  const title = payload.title || 'かけよ';
  const options = {
    body: payload.body || '',
    icon: payload.icon || '/icon-192.png',
    badge: payload.badge || '/icon-192.png',
    data: payload.data || {}
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 通知クリック時に対象 URL を開く（既に開いていればフォーカス）。
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === targetUrl && 'focus' in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
        return undefined;
      })
  );
});
