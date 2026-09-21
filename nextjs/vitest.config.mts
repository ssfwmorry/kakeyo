import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// ドメイン計算の単体テストのみを対象とする。旧 RPC 回帰テストは行わない。
// DB/React に触れないため node 環境で十分。
export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts']
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
      // server-only は非 Next 環境（Vitest）で import すると投げるため空モジュール化。
      // ドメイン計算の単体テストが server-only 付きファイルを間接 import しても通る。
      'server-only': fileURLToPath(
        new URL('./test/stubs/empty.ts', import.meta.url)
      )
    }
  }
});
