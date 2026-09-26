import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';

// Vercel の Function リージョンは既定（iad1 / 米国東部）のままで、日本のユーザ →
// 米国の Function → Supabase という経路になり DB クエリのたびに太平洋を往復する。
// クエリ回数の多い DB 側に寄せるのが原則で、Supabase のプロジェクトリージョンに
// 合わせれば（東京なら hnd1）遷移ごとの遅延を大きく削れる。設定先は vercel.json の
// "regions"（JSON はコメント不可のためここに記す）。今回は変更しない判断。

const nextConfig: NextConfig = {
  // 親ディレクトリ（既存 Nuxt）に package-lock.json があり Turbopack が
  // ワークスペースルートを誤検出するため、このディレクトリを明示する。
  // Nuxt 撤去後は不要になる。
  turbopack: {
    root: fileURLToPath(new URL('.', import.meta.url))
  }
};

export default nextConfig;
