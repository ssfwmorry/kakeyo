<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

public スキーマのDBに書き込みをするときは必ずユーザの許可をもらってから実行してください。

## 画面の動作確認（スクリーンショット）

画面まわりの変更をしたら、実際にアプリを起動して画面を目視で確認する。確認時はスクリーンショットを撮って一時保存し、画像を Read で開いて自分でも表示崩れ・文言・データ表示を確認すること（HTTP ステータスや HTML だけで済ませない）。

- **起動**: `pnpm build && pnpm start`（本番ビルド）で `http://localhost:3000` を立てる。DB は `.env` の接続先（リモート Supabase の `develop` スキーマ）を指すため、**書き込み系の確認はデモログインで行う**（デモは Server 層で no-op になり実 DB に副作用を与えない。§上記の「public スキーマへの書き込みは許可制」とも整合）。
- **保存先**: スクリーンショットは `nextjs/.screenshots/` に連番＋画面名（例 `01-login.png` / `02-bank.png`）で保存する。`.screenshots/` は `.gitignore` 済み（コミットしない一時確認用）。
- **認証必須画面（`(private)` 配下: bank / setting / calendar 等）**: 未認証で開くと proxy が `/login` にリダイレクトするため、そのままでは中身を撮れない。**Playwright MCP でデモログインボタンをクリック → 遷移 → スクショ**の順で撮る（Playwright MCP は `mico-eng-basic` プラグインが提供する `playwright` サーバーを使う。プロジェクトの `.mcp.json` には定義しない＝プラグイン版に一本化。ツールが未登録ならセッション再起動で反映される）。単純な headless Chrome スクショはログイン導線を辿れないので login 画面止まりになる。
- 確認後、一時ファイルが不要になったら `.screenshots/` は削除してよい。
