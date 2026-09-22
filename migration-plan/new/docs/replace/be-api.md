# BE 仕様書 - API 一覧

FE から呼び出される Supabase API（`api/supabase/*.ts`）を、ドメイン単位でまとめる。

- ほとんどの API は `composables/useSupabase.ts` 経由で公開され、FE から呼ばれる（VSCode でコードジャンプできるようにするため）。
  ただし一部（例: `createSettlementRecord` / `getTypeSummaryPeriod`、および `useCalendarStore` から呼ばれる `getMonthSum` / `getRecordList` / `getPlanList` / `getReminderList` / `postRecords`）は `~/api/supabase/*` から直接 import して使われる。
- DB スキーマは [tables.md](be-database.md)（本ドキュメント群の再構成版は今後追加、現時点は [docs/database/tables.md](../../../docs/database/tables.md) を参照）。
- RPC 関数の SQL 実体は [docs/database/functions.md](../../../docs/database/functions.md) を参照。

## 共通仕様

### 戻り値の型（`ApiOutput`）

すべての API は次の形を返す（`api/supabase/common.interface.ts`）。

```ts
type ApiOutput<S, T> = { data?: S; error: T | null; message: string };
```

- 成功時: `data` に値、`error` は `null`
- 失敗時: `error` に `PostgrestError` または文字列、`data` は `undefined`
- FE 側は `utils/api.ts` の `assertApiResponse()` で `data === undefined || error !== null` を検査し、
  予期せぬエラー時は `alert()` を出して throw する。

### 認証パラメータ（第 1 引数）

多くの API は第 1 引数に認証情報を受け取る。用途に応じて型が分かれる。

| 型 | 含む情報 | 用途 |
| :--- | :--- | :--- |
| `SupabaseApiUser` | `userUid` | 取得系（自分・ペアの絞り込み） |
| `SupabaseApiDemo` | `isDemoLogin` | 更新系（デモ時はスキップ） |
| `SupabaseApiUserAndPair` | `userUid` `pairId` | ペア込みの取得系（例: `getMemoList` / `getReminderList`） |
| `SupabaseApiDemoAndUser` | `isDemoLogin` `userUid` | デモ判定付き更新系（例: `upsertBank` / `postRecords`） |
| `SupabaseApiDemoAndUserAndPair` | `isDemoLogin` `userUid` `pairId` | デモ判定＋ペア対応（例: `insertMemo`） |
| `SupabaseApiAuthUpsert` | `isDemoLogin` `userUid` `isPair` `pairId` | ペア対応の upsert 系（`SupabaseApiDemoAndUserAndPair & { isPair }`） |

### デモログイン時の挙動

更新系 API は先頭で `if (isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;` により
**DB を変更せず成功扱いで返す**。取得系はそのまま実クエリを実行する（develop/public スキーマ）。

### 命名規則

- 取得: `getXxxList` / `getXxx`
- 追加/更新: `upsertXxx`（`id === null` なら insert、そうでなければ update）
- 追加のみ: `insertXxx` / `postXxx`
- 削除: `deleteXxx`
- 並び替え: `swapXxx`（RPC で 2 行の `sort` を 1 クエリ入れ替え）

### 実装方式（RPC / テーブル直接操作）

- **RPC**: 複数テーブル結合・集計・条件分岐が必要なもの（一覧取得・集計・sort 入替・record 補完）
- **テーブル直接操作**: 単純な CRUD（`supabase.from('...').insert/update/delete/select`）
- 取得結果は `humps.camelizeKeys` で snake_case → camelCase に変換される。

---

## record（記録）

家計簿の中核。`record_type` により 4 種類（0:SELF / 5:INSTEAD 立替 / 10:PAIR / 15:SETTLEMENT 精算）。

| API | 方式 | 操作 | 概要 |
| :--- | :--- | :--- | :--- |
| `getRecordList` | RPC `get_record_list` | select | 期間内の record 取得（カレンダー用） |
| `getSummarizedRecordList` | RPC `get_summarized_record_list` | select | 条件検索した record 取得（records 画面用、精算=15 は除外） |
| `getPairedRecordList` | RPC `get_paired_record_list` | select | ペアの record 取得（精算画面用） |
| `getMonthSum` | RPC `get_month_sum` | 集計 | 月の収支合計（自分視点） |
| `getTypeSummary` | RPC `get_type_summary` | 集計 | 月次カテゴリ別集計（サブカテゴリ内訳込み） |
| `getMethodSummary` | RPC `get_method_summary` | 集計 | 月次方法別集計 |
| `getTypeSummaryPeriod` | RPC `get_type_list` + `get_type_summary_period` | 集計 | 年次カテゴリ別集計（棒グラフ用）※type一覧と結合整形 |
| `getSubTypeSummary` | select + RPC `get_sub_type_summary` | 集計 | 年次サブカテゴリ別集計（sub_types 取得後に集計と結合） |
| `getPayAndIncomeList` | RPC `get_pay_and_income_list` | 集計 | 年次の月別 支出/収入 |
| `upsertRecord` | from('records') | insert/update | record 登録・更新（record_type を isPair/isInstead から算出） |
| `createSettlementRecord` | from('pairs')→from('records') | select+insert | 精算 record 作成（受取時は相手 user_id を pairs から引く） |
| `settleRecords` | from('records') | update(in) | 複数 record を `is_settled=true` に更新 |
| `postRecords` | RPC `post_records` | insert | planned_record から未登録 record を補完（未来日・登録後期間のみ） |
| `deleteRecord` | from('records') | delete | record 削除 |

**補足**

- `upsertRecord` の `record_type` 算出: `!isPair→0(SELF)` / `isPair && isInstead→5(INSTEAD)` / `isPair && !isInstead→10(PAIR)`。
- 集計系 RPC の `input_is_pair` / `input_is_include_instead` で対象 record_type が切り替わる（詳細は functions.md の case 文参照）。
- 精算 record（15）は `is_pay=null` のため、集計時は `user_id` と自分 UID の一致で支払/受取を判定する。

---

## planned_record（定期記録）

毎月決まった日に自動計上される record のテンプレート。`post_records` で実 record に展開。

| API | 方式 | 操作 | 概要 |
| :--- | :--- | :--- | :--- |
| `getPlannedRecordList` | RPC `get_planned_record_list` | select | 定期一覧（self/pair に振り分け） |
| `upsertPlannedRecord` | from('planned_records') | insert/update | 定期の登録・更新 |
| `deletePlannedRecord` | from('planned_records') | delete | 定期削除（紐づく record があると FK エラー 23503） |
| `swapPlannedRecord` | RPC `swap_planned_record` | update | 並び順(sort)の入れ替え |

---

## type / sub_type（カテゴリ・サブカテゴリ）

| API | 方式 | 操作 | 概要 |
| :--- | :--- | :--- | :--- |
| `getTypeList` | RPC `get_type_list` | select | カテゴリ+サブカテゴリ一覧。income/pay × self/pair に整形（sub_type をグルーピング） |
| `upsertType` | from('types') | insert/update | カテゴリ登録・更新 |
| `deleteType` | from('types') | delete | カテゴリ削除 |
| `swapType` | RPC `swap_type` | update | 並び替え |
| `upsertSubType` | from('sub_types') | insert/update | サブカテゴリ登録・更新 |
| `deleteSubType` | from('sub_types') | delete | サブカテゴリ削除 |
| `swapSubType` | RPC `swap_sub_type` | update | 並び替え |

> `getTypeList` の整形ロジック `getGroupedTypeList` は `type.ts` にあり、
> `getTypeSummaryPeriod`（record.ts）からも再利用される。

---

## method（支払/受取方法）

| API | 方式 | 操作 | 概要 |
| :--- | :--- | :--- | :--- |
| `getMethodList` | RPC `get_method_list` | select | 方法一覧。income/pay/both × self/pair に整形（`is_pay=null` は送金用の both） |
| `upsertMethod` | from('methods') | insert/update | 方法登録・更新 |
| `deleteMethod` | from('methods') | delete | 方法削除 |
| `swapMethod` | RPC `swap_method` | update | 並び替え |

---

## plan（予定）/ plan_type（予定カテゴリ）

| API | 方式 | 操作 | 概要 |
| :--- | :--- | :--- | :--- |
| `getPlanList` | RPC `get_plan_list` | select | 期間内の予定取得（plan_type色 / reminder色を結合） |
| `upsertPlan` | from('plans') | insert/update | 予定登録・更新 |
| `deletePlan` | from('plans') | delete | 予定削除 |
| `getPlanTypeList` | RPC `get_plan_type_list` | select | 予定カテゴリ一覧（self/pair 振り分け） |
| `upsertPlanType` | from('plan_types') | insert/update | 予定カテゴリ登録・更新 |
| `deletePlanType` | from('plan_types') | delete | 予定カテゴリ削除 |
| `swapPlanType` | RPC `swap_plan_type` | update | 並び替え |

---

## reminder（リマインダー）/ condition（条件）

reminder は必ず condition（発生条件）を伴う。作成/削除は 2 テーブルにまたがる。

| API | 方式 | 操作 | 概要 |
| :--- | :--- | :--- | :--- |
| `getReminderList` | from('reminders') | select | reminder + condition + color を結合取得（self/pair/all に振り分け） |
| `insertReminder` | from('conditions')→from('reminders') | insert×2 | condition を作成 → その id で reminder を作成 |
| `checkReminder` | from('plans')?→from('reminders') | insert?+update | 条件から次回日付を計算し reminder.date を更新。Stock 型なら plan も作成 |
| `deleteReminder` | from('reminders')→from('conditions') | delete×2 | reminder 削除 → 紐づく condition 削除 |

**補足（`checkReminder`）**

- `condition_type=10(MONTH_DAY)`: 翌年の `MM-DD` を次回日付に。
- `condition_type=5(MONTH)`: `base_type` により基準日（現在 or reminder.date）から `month` ヶ月後。
- `reminder_type=10(Stock)`: チェック時に plan として残す（plans に insert）。`5(Flow)` は日付更新のみ。

---

## bank（口座）/ bank_balance（残高）

※ 個人用（ペアモードでは設定画面で口座管理タブが非表示）。

| API | 方式 | 操作 | 概要 |
| :--- | :--- | :--- | :--- |
| `getBankList` | from('banks') | select | 口座一覧（color 結合） |
| `upsertBank` | from('banks') | insert/update | 口座登録・更新 |
| `deleteBank` | from('banks') | delete | 口座削除 |
| `getBankBalanceList` | from('bank_balances') | select | 直近 **5 年分** の残高履歴（banks!inner で自分の口座に絞る）を日付ごとに整形 |
| `postBankBalances` | from('bank_balances') | insert | 残高履歴をまとめて追加登録 |

---

## memo（TODO）

| API | 方式 | 操作 | 概要 |
| :--- | :--- | :--- | :--- |
| `getMemoList` | from('memos') | select | 自分 + ペアの TODO 一覧 |
| `insertMemo` | from('memos') | insert | TODO 追加（`isPair` で user_id / pair_id を切替） |
| `deleteMemo` | from('memos') | delete | TODO 削除 |

---

## short_cut（ショートカット）

| API | 方式 | 操作 | 概要 |
| :--- | :--- | :--- | :--- |
| `getShortCutList` | from('short_cuts') | select | 自分のショートカット一覧（type/sub_type/method と color を結合） |

> ショートカットからの記録は `upsertRecord`（record ドメイン）で行われる。作成/削除 API はこのコードベースには見当たらない。

---

## user / pair（ユーザ・ペア）

| API | 方式 | 操作 | 概要 |
| :--- | :--- | :--- | :--- |
| `getPairId` | from('pairs') | select | uid が user1/user2 のいずれかである pair.id を取得（0 件=null、2 件以上=異常） |

---

## master（マスタ）

| API | 方式 | 操作 | 概要 |
| :--- | :--- | :--- | :--- |
| `getColorClassificationList` | from('color_classifications') | select | 色マスタ（id, name）一覧 |
| `getDayClassificationList` | from('day_classifications') | select | 毎月何日か（id, name, value）一覧 |

---

## 認証（Firebase Auth / `composables/useFirebase.ts`）

Supabase ではなく Firebase Auth を利用。ユーザ登録・ログイン・退会など。

| API | 概要 |
| :--- | :--- |
| `signUp` | 新規登録 + 本人確認メール送信 |
| `signInByUserLogin` | メール/パスワードでログイン（未認証メールは拒否、ホワイトリスト除く） |
| `signInByDemoLogin` | デモユーザでログイン |
| `sendPasswordResetEmail` | パスワード再設定メール送信 |
| `signOut` | ログアウト |
| `deleteUser` | アカウント削除（デモユーザはリリース時スキップ） |
