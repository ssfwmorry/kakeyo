import type { MetadataRoute } from 'next';
import { THEME_COLOR } from '@/features/pwa/theme-color';

// App Router 標準の PWA マニフェスト。
// 要件はホーム画面追加・全画面表示（installable + standalone）。
// オフラインキャッシュ（next-pwa/Workbox）は採用せず、依存を増やさない。
//
// icons の PNG は public/icon.svg から生成する（生成条件はそちらに書いてある）。
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'かけよ',
    short_name: 'かけよ',
    description: '個人・ペア向けの家計簿アプリ',
    lang: 'ja',
    start_url: '/',
    display: 'standalone',
    // theme_color はインストール時に固定され後から変えられないので、起動後の
    // ステータスバーは layout.tsx の meta[name=theme-color] 側が受け持つ。
    // ここはインストール前とスプラッシュのための初期値。
    background_color: THEME_COLOR.light,
    theme_color: THEME_COLOR.light,
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icon-maskable-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ]
  };
}
