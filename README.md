# かけよ

個人・ペア向けの家計簿アプリ。Next.js（App Router）+ Prisma + Supabase（Auth / Postgres）で動き、Vercel にデプロイする。

- 横断のコーディング規約・画面の動作確認手順: [AGENTS.md](AGENTS.md)
- DB の定義（DDL・関数・データ・移行の記録）: [docs/database/](docs/database/)
- 新デザイン適用の計画と決定事項: [docs/new-design/](docs/new-design/)
- 移行後に残っている作業: [migration-plan/残タスク.md](migration-plan/残タスク.md)

## Project Setup

- Supabase にプロジェクトを作成し、開発用スキーマ `develop` と本番用スキーマ `public` を用意する（Email provider を有効にする）
- Node.js は `.tool-versions` のバージョンを使う（asdf / mise）。パッケージマネージャは pnpm
- `.env.example` を参考に、ローカル実行用の `.env` を作成する（本番の値は Vercel の環境変数に置く）
- Vercel CLI でデプロイする場合は `vercel link` でプロジェクトに紐づける（`.vercel/` はコミットしない）

## Build Setup

```bash
# install dependencies
$ pnpm install
# serve with hot reload at localhost:3000
$ pnpm dev
# production build（prisma generate を含む）と起動
$ pnpm build && pnpm start
# lint / format / type check
$ pnpm check:full
# unit tests（ドメイン計算）
$ pnpm test
```

## デプロイ

```bash
# preview
$ pnpm deploy:preview
# production
$ pnpm deploy
```

- Vercel プロジェクトの Root Directory はリポジトリのルート（未設定）にする
- 定期の記録の実体化は `/api/cron/post-records` を Vercel Cron で日次実行する。有効にするときは `vercel.json` に `crons` を定義し、環境変数 `CRON_SECRET` を設定する

## Git コミットコメント規則

コミットメッセージは「何をどう変えたか」を日本語の 1 行で書き、必要なら本文に理由を添える。タスク ID は書かない（[AGENTS.md](AGENTS.md) のコメント規約と同じ）。

## 開発規則

### DB 関連の定義

- 場所: `docs/database/`
- PUSH するのは `develop` スキーマで行う（`public` に反映する作業時は、同じ DML を実行することは少ないため）
- `public` スキーマへの書き込みを伴う作業は、実行前に必ず確認を取る

### 本番環境に反映時

- DB の変更がある場合には `docs/database/migration.md` に作業を記載
- 本番に反映したコミットにタグを付ける

### エラー処理

- 予期しないエラーは `Result` の `unknown` に分類し、Server Action が汎用のエラー文言を付ける
- error トーストは、ユーザの意図した処理が失敗したときに使用（自動では消えない）
- 完了トーストは、正常終了時に使用（約 3 秒で消える）

### デモ

デモモードは署名付き Cookie と `src/features/demo` のデータセットだけで成立し、DB には触れない。ログイン画面の「デモページを見る」から入る。書き込み系の動作確認はデモログインで行う。
