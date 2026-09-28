'use client';

import { useEffect, useState } from 'react';

// オフライン表示バー。
//
// SW のナビゲーション network-first により、圏外でも「最後に見た画面」が
// 表示される。ただしその画面は取得時点のスナップショットなので、古い残高を
// 現在値と誤認させないために、オフライン中であることを常時明示する。
//
// 判定は navigator.onLine と online/offline イベントのみ。これは「ネットワーク
// インタフェースが生きているか」であり到達性の保証ではないが、機内モード・圏外
// といった実際に問題になるケースは捕捉できる。SW が返す x-kakeyo-stale ヘッダは
// ナビゲーション応答に付くもので、クライアント側の JS からは読めないため使わない。
export function OfflineBanner() {
  // SSR と初回ハイドレーションでは常にオンライン扱いにする。
  // navigator を初期値に使うとサーバ側の出力と食い違い hydration mismatch になる。
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const sync = () => setIsOffline(!navigator.onLine);

    // マウント直後に現在値へ合わせる（オフラインのまま起動した場合に対応）。
    sync();

    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
    };
  }, []);

  if (!isOffline) {
    return null;
  }

  return (
    <div
      role='status'
      className='flex items-center justify-center gap-1 bg-amber-500 px-4 py-1 text-center font-medium text-amber-950 text-xs'
    >
      オフラインです。表示中の内容は最新ではない可能性があります。
    </div>
  );
}
