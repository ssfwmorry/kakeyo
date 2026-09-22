import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// ドメイン計算の単体テストのみを対象とする。旧 RPC 回帰テストは行わない。
// DB/React に触れないため node 環境で十分。
export default defineConfig({
  test: {
    environment: 'node',
    // ドメイン計算テストは lib/ と各 feature の domain/ に置く。feature 側も CI 対象に含める
    // （server-only は下の alias で空モジュール化されるため間接 import しても通る）。
    include: ['src/lib/**/*.test.ts', 'src/features/**/*.test.ts']
  },
  resolve: {
    alias: [
      // prisma 生成物は src 外（prisma/generated）にあるため src エイリアスより先に解決する。
      {
        find: /^@\/prisma\//,
        replacement: `${fileURLToPath(new URL('./prisma', import.meta.url))}/`
      },
      {
        find: /^@\//,
        replacement: `${fileURLToPath(new URL('./src', import.meta.url))}/`
      },
      // server-only は非 Next 環境（Vitest）で import すると投げるため空モジュール化。
      // ドメイン計算の単体テストが server-only 付きファイルを間接 import しても通る。
      {
        find: 'server-only',
        replacement: fileURLToPath(
          new URL('./test/stubs/empty.ts', import.meta.url)
        )
      }
    ]
  }
});
