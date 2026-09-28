'use client';

import { useEffect } from 'react';

// Service Worker（public/sw.js）の登録専用クライアントコンポーネント。
//
// 配線: app/layout.tsx（root layout）に <SwRegister /> を常設済み（全ページで一度だけ
//   登録）。manifest によるインストール自体は SW 無しでも成立するが、オフラインの殻と
//   将来の Push の受け皿として登録しておく。
//
// 開発中は登録しない。sw.js は /_next/static を cache-first で持つが、その前提
// 「URL にビルドハッシュが入るので同じ URL の中身は変わらない」は本番ビルドでしか
// 成り立たない。dev のチャンク名は内容が変わっても同じで、サーバーを立て直すと
// SW が古い CSS/JS を返し続けて画面が崩れる。既に登録済みのものも剥がして、
// 一度でも本番と同じ SW を掴んだブラウザが dev でハマらないようにする。
export function SwRegister() {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    if (process.env.NODE_ENV !== 'production') {
      void unregisterAll();
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

// 登録済みの SW と、それが持つキャッシュ（kakeyo-*）を消す。
async function unregisterAll(): Promise<void> {
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((sw) => sw.unregister()));
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith('kakeyo-'))
          .map((key) => caches.delete(key))
      );
    }
  } catch {
    // 消せなくてもアプリ本体には影響しない。
  }
}
