'use client';

import { useEffect } from 'react';

// Service Worker（public/sw.js）の登録専用クライアントコンポーネント。
//
// 方針書 §6 / 手順書 §7.4-4 に基づく最小 PWA 構成。sw.js 自体はオフライン
// キャッシュを持たず、インストール要件の充足と将来の Web Push の受け皿が目的。
//
// 配線: app/layout.tsx（root layout）に <SwRegister /> を常設済み（全ページで一度だけ
//   登録）。manifest によるインストール自体は SW 無しでも成立するが、将来の Push の
//   受け皿として登録しておく。
export function SwRegister() {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // ページ描画を妨げないよう load 後に登録する。
    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        // 登録失敗はアプリ本体の動作に影響させない（PWA は付加機能のため握りつぶす）。
        console.error('Service Worker registration failed:', error);
      });
    };

    if (document.readyState === 'complete') {
      register();
      return;
    }

    window.addEventListener('load', register);
    return () => window.removeEventListener('load', register);
  }, []);

  return null;
}
