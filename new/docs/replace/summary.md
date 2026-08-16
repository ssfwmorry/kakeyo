# Kakeyo（かけよ）仕様書サマリ

このドキュメント群は、既存コードからリバースエンジニアリングした仕様書である。
大方針として **FE（フロントエンド）** と **BE（バックエンド）** に分けて記載する。

## アプリ概要

- 個人・カップル（ペア）向けの家計簿 PWA
- 支出/収入の記録、口座残高管理、予定・リマインダー管理、ペア間の立替精算などを扱う
- 技術スタック: Nuxt 3（SPA / `ssr: false`）+ Vue 3 + Vuetify 3、状態管理は Pinia、認証は Firebase Auth、DB/API は Supabase（PostgreSQL・RPC 中心）

## ドキュメント構成

| 区分 | ファイル | 内容 |
| :--- | :--- | :--- |
| FE | [fe-screens.md](fe-screens.md) | 各画面でできること・画面ごとに呼び出す API 一覧・画面遷移 |
| BE | [be-api.md](be-api.md) | Supabase API（RPC / テーブル操作）一覧、共通仕様、認証 |
| BE | [be-database.md](be-database.md) | DB スキーマ俯瞰・リレーション・record_type 定義・RPC カタログ |

> DDL・RPC の SQL 実体は既存の [docs/database/](../../../docs/database/) を正とし、
> 上記 BE ドキュメントは構造理解・API との対応づけのための再構成版とする。

## 主要な状態管理（Pinia ストア）

全画面で横断的に利用される。FE ドキュメントの前提知識として記載する。

| ストア | 役割 | 主なプロパティ |
| :--- | :--- | :--- |
| `useAuthStore` | ログイン状態・ユーザ情報 | `isLoggedIn` / `isDemoLogin` / `isUserLogin` / `userUid` / `pairId` / `isExistPair`（localStorage 永続化） |
| `usePairStore` | 共有(ペア)モードの ON/OFF | `isPair` / `setIsPair` |
| `useCalendarStore` | カレンダー表示データの生成 | `updateRange`（record/plan/reminder をまとめて取得・整形） |
| `useRouterParamStore` | 画面間のパラメータ受け渡し | `setRouterParam` / `routerParam`（query に載せない大きめのオブジェクトを渡す） |
| `useLoadingStore` | ローディング表示 | `enableLoading` / `disableLoading` / `loading` |
| `useToastStore` | トースト通知 | `setToast(message, 'info'|'warning'|'error')`（省略時は `'info'`） |

## 認証状態による画面アクセス制御

`middleware/auth.global.ts` により全遷移をガードする。

- **未ログイン時**: `login` / `inquiry` のみアクセス可。それ以外は `login` へリダイレクト
- **ログイン時**: `login` へ行くと `note` へ、`index`(/) へ行くと `calendar` へリダイレクト
