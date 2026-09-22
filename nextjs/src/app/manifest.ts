import type { MetadataRoute } from 'next';

// App Router 標準の PWA マニフェスト。
// 要件はホーム画面追加・全画面表示（installable + standalone）。
// オフラインキャッシュ（next-pwa/Workbox）は採用せず、依存を増やさない。
//
// icons: 192/512 の通常アイコンと maskable を用意。
// TODO(icon): public/ の各 icon-*.png は 32x32 素材を拡大した暫定プレースホルダ。
//             正式リリース前に高解像度のブランドアイコンへ差し替える。
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'かけよ',
    short_name: 'かけよ',
    description: '個人・ペア向けの家計簿アプリ',
    lang: 'ja',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
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
