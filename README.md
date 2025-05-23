# Kakeyo

## Project Setup

- Firebase にプロジェクトを作成し、CLI を入れておく
  - `.firebaserc` と `firebase.json` を書き換える
- Supabase にプロジェクトを作成する
  - 開発用のデータベース `develop` と 本番用のデータベース `public` を作成しておく
- NodeJS を入れておく
- `env.example` を参考に、 ローカル実行用の `.env` と本番ビルド用の `env.prod` を作成する

## Build Setup

```bash
# install dependencies
$ npm install
# serve with hot reload at localhost:3000
$ npm run dev
# generate static project
$ npm run generate
```

## デプロイ

```bash
$ firebase deploy
# プロジェクトが見つからない旨のエラーが表示される場合、
# 長期間ログインしていないことが原因だと予想される。そのため一度ログアウトする
$ firebase logout
$ firebase login
$ firebase use <project-id>
```

## Git コミットコメント規則

| 書き方         | 用途               |
| -------------- | ------------------ |
| feat:          | 新機能             |
| fix(各種画面): | 画面での変更       |
| fix(typo):     | typo 修正          |
| bug(各種画面): | バグ修正           |
| fix(DB):       | DB の構成変更      |
| fix(README)    | README 変更        |
| fix(docs)      | docs 変更          |
| fix(demo)      | デモ用 変更        |
| todo:          | todo を消化/作成   |
| perf           | パフォーマンス改善 |
| refactor       | リファクタリング   |
| release        | リリース対応       |

## 開発規則

### PUSH 時

#### DB 関連の定義

- 場所: `docs/database/`
- PUSH するのは、`develop` スキーマで行う（ `public` に反映する作業時は、同じ DML を実行することは少ないため）

### デプロイ時・本番環境に反映時

- DB の変更がある場合には `migrations.md` に作業を記載
- コミットにタグづけを行う
  - `{hash}` の形式とする
    - `{hash}` には `firebase deploy` 後のハッシュ値を記載する

## 実装規則

### 変数名

- DB に入っている複数形は全て`~s`、JS では`~list`
- `bool`型は`is~`

### コンポーネント内プロパティの順序

以下の優先順位で書く。

1. id や name
1. `v-if` などのディレクティブ
1. Vuetify のプロパティ(定数)
1. Vuetify のプロパティ(変数)
1. 自作 class/style
1. イベント

### エラー処理

- `alert()`は予期せぬエラーが発生した時に使用
- error トースト表示は、ユーザの意図した処理が失敗したときに使用
- info トーストは、正常終了時に使用

### デモ

| 環境変数 (NUXT_PUBLIC\_\*) | DB             | SKIP | 備考                             |
| -------------------------- | -------------- | ---- | -------------------------------- |
| DEMO_USER_EMAIL            | develop/public | F    | デモログインユーザ               |
| DEMO_USER_PASSWORD         | develop/public | -    | デモログインユーザ               |
| DEMO_USER_UID              | develop/public | -    | デモログインユーザ               |
| DEMO_USER_PAIR_EMAIL       | develop/public | T    | デモログインユーザの共有相手     |
| DEMO_USER_PAIR_PASSWORD    | develop/public | -    | デモログインユーザの共有相手     |
| DEMO_USER_PAIR_UID         | develop/public | -    | デモログインユーザの共有相手     |
| TEST_USER_PUB1             | public         | F    | テストユーザ                     |
| TEST_USER_DEV1             | develop        | T    | テストユーザ 1                   |
| TEST_USER_DEV2             | develop        | T    | テストユーザ 1 の共有相手        |
| TEST_USER_DEV3             | develop        | T    | 共有設定をしていないテストユーザ |

### ブラウザ内ストレージ

- ローカルストレージ
  - pinia によって永続化された Store が保存される
