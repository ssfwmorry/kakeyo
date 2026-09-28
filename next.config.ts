import type { NextConfig } from 'next';

// Function のリージョンは vercel.json の "regions" で東京（hnd1）に固定している。
// 既定（iad1 / 米国東部）のままだと日本のユーザ → 米国の Function → 東京の Supabase と
// なり、クエリのたびに太平洋を往復する。クエリ回数の多い DB 側に寄せるのが原則。

const nextConfig: NextConfig = {};

export default nextConfig;
