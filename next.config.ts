import type { NextConfig } from 'next';

// Function のリージョンは vercel.json の "regions" で東京（hnd1）に固定している。
// 既定（iad1 / 米国東部）のままだと日本のユーザ → 米国の Function → 東京の Supabase と
// なり、クエリのたびに太平洋を往復する。クエリ回数の多い DB 側に寄せるのが原則。

// Cache Components（Next.js 16）。動的 API（cookies 等）は Suspense 境界の内側でのみ
// 許され、境界の外は静的シェルとして事前描画される。これが無いと (private) 配下は
// 全ルートが動的になり、tab-bar の prefetch が実効しない（docs/loading-ux L04）。
const nextConfig: NextConfig = {
  cacheComponents: true
};

export default nextConfig;
