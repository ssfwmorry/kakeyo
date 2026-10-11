# Railway デプロイ手順

Vercel 構成（`vercel.json` / `pnpm deploy`）は残したまま、Railway へもデプロイできる状態にしてある。

- 本番 URL: https://kakeyo.up.railway.app
- プロジェクト名 `kakeyo` / サービス名 `app`（名前が異なるので CLI の `--service` 指定時は注意）

## 前提

Railway CLI と IaC SDK は pnpm の devDependency として入っている（グローバルインストール不要）。

- `@railway/cli` … `pnpm exec railway <cmd>` で呼ぶ
- `railway` … `.railway/railway.ts` が `railway/iac` を import するため必須。未インストールだと
  `railway config plan` が失敗する

## 初回セットアップ

```sh
pnpm exec railway login
pnpm exec railway link            # 既存プロジェクト kakeyo に接続
pnpm exec railway up              # デプロイ
```

## 環境変数

Railway ダッシュボードの Variables が正（IaC は変数を管理しない。後述）。`.env` は Railway に送られない。
必要な変数は `.env.example` を正とする。本番は `SUPABASE_DATABASE_SCHEMA=public`。
`PORT` は Railway が自動注入するので設定しない。

```sh
pnpm exec railway variables --kv   # 設定済みの値を確認
```

## 構成管理（IaC）

`.railway/railway.ts` がビルド（`pnpm build`）と起動（`pnpm start -p $PORT`）を定義する。

```sh
pnpm exec railway config plan        # 差分プレビュー
pnpm exec railway config apply --yes # 適用
```

`variables: { managed: false }` にしてあるため、IaC は環境変数を読み書きしない。
`plan` に `5 on Railway not managed` と出るのが正常で、ダッシュボード側の値は apply で消えない。
`managed: true` にすると、このファイルに書かれていない変数が apply 時に削除されるため、
秘密値をリポジトリに置かない限り切り替えない。

`service()` の第1引数は実サービス名 `app` と一致させる。ここが食い違うと `plan` が
`+ Create service ...` となり、既存サービスを更新せず新しいサービスを作ってしまう。

## リージョン

DB が東京の Supabase（`aws-0-ap-northeast-1` の pooler）なので、サービスは日本に近いリージョンに置く。
現在は Southeast Asia。変更はダッシュボードの Service → Settings → Regions から行う
（`.railway/railway.ts` では指定できない）。

接続は pooler 経由（`:6543` / `pgbouncer=true`）。Railway はコンテナが再起動・スケールしうるため、
direct 接続（5432）にすると Supabase の接続上限を食い潰しやすい。

## Cron（未対応）

`/api/cron/post-records` は Vercel Cron 前提（`Authorization: Bearer $CRON_SECRET`）。
Railway には自アプリの HTTP を定期実行する機能がないため未配線で、`CRON_SECRET` も未設定（503 を返す）。
配線する場合は、curl を叩くだけの別サービスを cron スケジュールで動かす構成になる。
