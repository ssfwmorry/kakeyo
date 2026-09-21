import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 親ディレクトリ（既存 Nuxt）に package-lock.json があり Turbopack が
  // ワークスペースルートを誤検出するため、このディレクトリを明示する。
  // TODO: 後々削除する
  turbopack: {
    root: fileURLToPath(new URL('.', import.meta.url))
  }
};

export default nextConfig;
