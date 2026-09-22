<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

public スキーマのDBに書き込みをするときは必ずユーザの許可をもらってから実行してください。

## 横断コーディング規約（全 feature 共通・コード内には再掲しない）

以下は移行方針確定書 / 移行手順書で凍結済みの全体ルール。各 feature のコードに同じ説明を書かず、ここを唯一の正とする（判断に迷ったら該当ソースの実装を読む）。

- **scope（情報漏洩防止の要）**: 全リポジトリの取得系は `buildScopeWhere`（pair 共有テーブル）/ `buildOwnerScopeWhere`（個人専用テーブル。`records`/`short_cuts`/`bank` 等）を必ず通す。更新・削除は Prisma が RLS をバイパスするため、`updateMany`/`deleteMany` の where に scope を AND して IDOR を塞ぐ（`count===0` = scope 外/不存在）。
- **セッション由来のスコープ**: `userUid` / `pairId` は `getSessionData()`（サーバ真偽源。`getSessionData` は React `cache()` で per-request メモ化）から確定し、クライアント値・フォーム値を信用しない。ペアモード（共有 ON/OFF）は `getPairMode`（Cookie の単一の正）から読み、自前で Cookie を読まない。
- **デモ注入**: サービス層は取得を `withDemoRead`、更新を `withDemoWriteVoid` に通す（デモは実 DB へ触れず、取得=モック / 更新=no-op 成功）。集計もデモでは DB に触れない。
- **サービス層の戻り値**: サービス/リポジトリは `Result<T, E>`（UI 文言を持たない機械可読な失敗分類）を返し、Server Action が `toFormResult` で `FormActionResult` に変換して文言を付ける。Prisma の FK 制約違反（P2003）は `foreignKey` へ写し、それ以外は `unknown` に分類する。
- **BigInt PK 境界**: `records` / `short_cuts` の PK は Prisma 上 `BigInt`。`JSON.stringify` で落ちるため、リポジトリ/サービスの境界で `Number(row.id)` へ変換し、Server→Client を跨ぐ公開型は常に `id: number`（`Id`）にする（方針確定書 §4.1）。
- **金額・日付**: 金額は共有 `priceSchema`（`lib/shared/domain/price.ts`。全角/カンマ正規化 + 非負整数）を経由し、素の `Number()` を使わない（§4.2）。日付は `lib/shared/domain/date.ts` の関数経由でのみ扱い、`dayjs` を直 import しない（extend 未適用インスタンス事故と SSR の JST 境界ズレの防止・§4）。
- **feature 固有 labels**: 各 feature の `labels.ts` には feature 固有の文言のみ置く。保存/削除/編集/並べ替え/色などの汎用文言・成否通知・汎用エラーは `@/lib/shared/labels`（`L`）を使う。
- **フォーム標準**: 入力は「1 フォーム = 1 スキーマ = 1 useForm」。`schemas/*.ts`（Conform + Zod）→ Server Action で `parseWithZod`（`@conform-to/zod/v4`）→ `@/components/form/FormField` + `useFormAction`。`session` 由来の値（userId/pairId 等）はスキーマに含めない。ダイアログ系の `useForm` `defaultValue` はマウント時に一度だけ取り込まれるため、編集対象ごとに `key` を変えてリマウントしプリフィルを効かせる。
- **トースト2系統**: 遷移しないフォームは `FormActionResult.toast`（`useFormToast` が発火）、`redirect()` を挟む Server Action は `setFlashToast`（Cookie 経由・遷移先の `FlashToast` が消費）を使い、二重発火を避けるためどちらか一方に統一する。

## 画面の動作確認（スクリーンショット）

画面まわりの変更をしたら、実際にアプリを起動して画面を目視で確認する。確認時はスクリーンショットを撮って一時保存し、画像を Read で開いて自分でも表示崩れ・文言・データ表示を確認すること（HTTP ステータスや HTML だけで済ませない）。

- **起動**: `pnpm build && pnpm start`（本番ビルド）で `http://localhost:3000` を立てる。DB は `.env` の接続先（リモート Supabase の `develop` スキーマ）を指すため、**書き込み系の確認はデモログインで行う**（デモは Server 層で no-op になり実 DB に副作用を与えない。§上記の「public スキーマへの書き込みは許可制」とも整合）。
- **保存先**: スクリーンショットは `nextjs/.screenshots/` に連番＋画面名（例 `01-login.png` / `02-bank.png`）で保存する。`.screenshots/` は `.gitignore` 済み（コミットしない一時確認用）。
- **認証必須画面（`(private)` 配下: bank / setting / calendar 等）**: 未認証で開くと proxy が `/login` にリダイレクトするため、そのままでは中身を撮れない。**Playwright MCP でデモログインボタンをクリック → 遷移 → スクショ**の順で撮る（Playwright MCP は `mico-eng-basic` プラグインが提供する `playwright` サーバーを使う。プロジェクトの `.mcp.json` には定義しない＝プラグイン版に一本化。ツールが未登録ならセッション再起動で反映される）。単純な headless Chrome スクショはログイン導線を辿れないので login 画面止まりになる。
- 確認後、一時ファイルが不要になったら `.screenshots/` は削除してよい。
