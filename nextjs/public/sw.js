// 最小 Service Worker（方針書 §6 / 手順書 §7.4-4）。
//
// 目的は「PWA インストール要件の充足」と「将来の Web Push の受け皿」のみ。
// オフラインキャッシュ（fetch ハンドラでのキャッシュ）は方針上あえて実装しない
// （next-pwa/Workbox も不採用）。将来 Push を実装する際にこのファイルへ
// 購読管理・表示ロジックを足す。

// インストール直後に待機を飛ばして即 activate させる。
self.addEventListener('install', () => {
  self.skipWaiting();
});

// activate 時に既存クライアントを即時制御下に置く。
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

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
