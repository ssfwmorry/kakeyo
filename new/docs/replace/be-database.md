# BE 仕様書 - データベース / RPC

Supabase（PostgreSQL）のスキーマ・リレーション・RPC 関数の構造をまとめる。

- 完全な DDL（列定義・型・制約）は [docs/database/tables.md](../../../docs/database/tables.md) を正とする。本ページは構造理解のための俯瞰。
- RPC 関数の SQL 実体は [docs/database/functions.md](../../../docs/database/functions.md) を参照。

## スキーマ構成

- 開発用: `develop.*` / 本番用: `public.*`（同一 DDL、環境変数 `NUXT_PUBLIC_SUPABASE_SCHEMA` で切替）
- 全テーブルで **RLS 有効**、`anon` ロールに対し `using (true)` の全許可ポリシー（認証は Firebase 側で担保）
- timezone は `Asia/Tokyo`

## テーブル一覧とリレーション

```
users ──┐
        ├─< pairs (user1_id, user2_id)
        │
color_classifications ──< methods / types / plan_types / banks / reminders
day_classifications   ──< planned_records

methods ─┐
types ───┼─< records / planned_records / short_cuts
sub_types┘   (types ─< sub_types)

planned_records ──< records (planned_record_id, on delete set null)
plan_types ──< plans
conditions ──< reminders ──< plans (reminder_id)
banks ──< bank_balances
```

### 個人 / ペアの表現（重要な設計）

多くのテーブル（methods, types, plan_types, records, planned_records, plans, memos, short_cuts, reminders）は
`user_id`（個人所有）と `pair_id`（ペア共有）の **どちらか一方** を持つ。

- 取得系 RPC / クエリは概ね `user_id = 自分 OR pairs.user1_id = 自分 OR pairs.user2_id = 自分` で絞り込む。
- `is_pair` は `pair_id IS NOT NULL` から算出して返す。

### トランザクションテーブル

| テーブル | 役割 | 主なキー |
| :--- | :--- | :--- |
| `users` | ユーザ（uid は Firebase UID） | uid(PK) |
| `pairs` | ペア関係 | user1_id, user2_id |
| `methods` | 支払/受取/送金方法 | user_id / pair_id, is_pay, sort |
| `types` | 支出/収入カテゴリ | user_id / pair_id, is_pay, sort |
| `sub_types` | サブカテゴリ | type_id, sort |
| `records` | 家計簿レコード | record_type, datetime, price ほか |
| `planned_records` | 定期レコード（テンプレート） | day_classification_id, sort, updated_at |
| `plans` | カレンダー予定 | start_date, end_date, plan_type_id, reminder_id |
| `plan_types` | 予定カテゴリ | user_id / pair_id, sort |
| `conditions` | リマインダー発生条件 | condition_type, month, month_day, base_type |
| `reminders` | リマインダー | reminder_type, condition_id, date |
| `memos` | TODO | user_id / pair_id, memo |
| `short_cuts` | 記録ショートカット | is_pay, method_id, type_id, record_type |
| `banks` | 口座 | user_id, color_classification_id |
| `bank_balances` | 口座残高履歴 | bank_id, price, created_at |

### マスタテーブル

| テーブル | 内容 |
| :--- | :--- |
| `day_classifications` | 毎月何日か（1/10/15/25 日） |
| `color_classifications` | 色（red〜black の 18 色。Vuetify カラー名に対応） |

## record_type の完全定義

`records` / `planned_records` / `short_cuts` が共有する分類。集計ロジックの起点。

| record_type | 意味 | user_id | pair_id | is_pay | is_settled | 説明 |
| :---: | :--- | :---: | :---: | :---: | :---: | :--- |
| 0 | SELF | 自分 | - | T/F | - | 個人の記録 |
| 5 | INSTEAD（立替） | 立替した人 | あり | true 固定 | T/F | ペアで一方が立て替えた記録。精算対象 |
| 10 | PAIR | - | あり | T/F | - | 二人共通の記録 |
| 15 | SETTLEMENT（精算） | 払った人 | あり | null | - | 精算のための送金記録。type_id なし |

- **収支計算での扱い**（`get_month_sum` 等）: 自分視点で、SELF(0) は is_pay で加減、INSTEAD(5) は自分の立替のみ支払計上、PAIR(10) はノーカウント、SETTLEMENT(15) は自分が払えば支払・相手が払えば受取。
- 精算 record は `is_pay=null` のため、`user_id` と自分 UID の一致で支払/受取を判定する（各集計 RPC の case 文）。

## RPC 関数カタログ

`api/supabase/rpc/*.interface.ts` に呼び出し名の定数と行の型がある。SQL 本体は functions.md。

### 並び替え（sort 入替：2 行の sort を 1 クエリで交換）

| 関数 | 対象 |
| :--- | :--- |
| `swap_method` / `swap_type` / `swap_sub_type` / `swap_plan_type` / `swap_planned_record` | 各テーブルの sort |

### 一覧取得（結合・整形あり）

| 関数 | 概要 |
| :--- | :--- |
| `get_type_list` | type + sub_type + color。is_pair/is_pay で FE 側が分類 |
| `get_method_list` | method + color |
| `get_plan_type_list` | plan_type + color |
| `get_planned_record_list` | planned_record + 各種名称・色・立替相手名 |
| `get_plan_list` | 期間内の plan + plan_type色 / reminder色 |
| `get_record_list` | 期間内の record + 名称・色・共有相手名 |
| `get_summarized_record_list` | 条件検索した record（records 画面用、精算=15 除外） |
| `get_paired_record_list` | ペアの record（精算画面用、編集不要な最小列） |

### 集計

| 関数 | 概要 |
| :--- | :--- |
| `get_month_sum` | 月の収支合計（自分視点） |
| `get_type_summary` | 月次カテゴリ別集計（サブカテゴリ内訳込み、window 関数で type 合計） |
| `get_method_summary` | 月次方法別集計 |
| `get_type_summary_period` | 年次カテゴリ別集計（積み上げ棒グラフ用） |
| `get_sub_type_summary` | 年次サブカテゴリ別集計（TODO: 命名に `_period` を付ける予定） |
| `get_pay_and_income_list` | 年次の月別 支出/収入合計 |

### 書き込み

| 関数 | 概要 |
| :--- | :--- |
| `post_records` | planned_record から未登録の record を補完 insert。`updated_at <= 対象月初` かつ `計上日 > now()`（未来日）のみ。record_type / is_settled は user_id・pair_id の有無から算出 |

## マイグレーション運用

- PUSH 時の DB 定義は `develop` スキーマで行う（[docs/database/tables.md](../../../docs/database/tables.md) は develop 想定）。
- 本番反映時は [docs/database/migration.md](../../../docs/database/migration.md) に作業 DML を記載し、コミットにハッシュタグを付す（README「開発規則」参照）。
