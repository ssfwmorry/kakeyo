# FE 仕様書 - 画面一覧

各画面で「何ができるか」と「呼び出す API」をまとめる。

- API 名は `composables/useSupabase.ts` 経由で呼ぶ Supabase API、または `useFirebase.ts` の Firebase Auth API を指す。
- API の実体・入出力は BE ドキュメント（および [docs/database/](../../../docs/database/)）を参照。
- 記号: 🔓=未ログインでもアクセス可 / 🔒=要ログイン / 🤝=ペア(共有)モードで挙動が変わる

## 画面（ページ）一覧

| ルート名 (`PAGE`) | パス | 画面 | 概要 |
| :--- | :--- | :--- | :--- |
| `LOGIN` 🔓 | `/login` | ログイン | ログイン / デモログイン / パスワード再設定 |
| `INQUIRY` 🔓 | `/inquiry` | 問い合わせ | 静的な案内表示のみ（API なし） |
| `INDEX` | `/` | （リダイレクト用） | 直接表示しない。ログイン時は `calendar` へ誘導 |
| `CALENDAR` 🔒🤝 | `/calendar` | カレンダー（ホーム） | 月次カレンダー・日別 record 表示・TODO・ショートカット記録・予定/リマインダー |
| `NOTE` 🔒🤝 | `/note` | 記録入力 | record / planned_record の登録・編集・削除 |
| `SUMMARY` 🔒🤝 | `/summary` | 集計 | 円グラフ(内訳) / 棒グラフ(推移) / 精算 のタブ表示 |
| `RECORDS` 🔒🤝 | `/records` | record 明細 | summary から遷移。カテゴリ/方法・月ごとの record 一覧 |
| `PLAN` 🔒🤝 | `/plan` | 予定入力 | plan（予定）の登録・編集・削除 |
| `BANK` 🔒 | `/bank` | 口座残高 | 口座残高の履歴グラフ・テーブル・残高追加 |
| `SETTING` 🔒🤝 | `/setting` | 設定 | カテゴリ/方法/口座/定期/予定カテゴリ/リマインダー、アカウント操作 |

---

## 共通レイアウト（`layouts/default.vue`）

全ログイン画面で表示される。ナビゲーションとリマインダー通知を担う。

**できること**

- ボトムナビゲーション（タブ）で主要画面へ遷移（calendar / summary / note / bank / setting）。`inquiry` はドロワー内のみ
- 共有(ペア)モードの切り替え（`usePairStore.isPair`）。ただし切替スイッチは `isExistPair` かつ `pagesWithoutPair`（calendar / records / bank）以外の画面でのみ表示
- ログアウト（`signOut` → `setLogout` → login へ）
- リマインダー通知（`AppBarNotification` コンポーネント）

**呼び出す API**

| コンポーネント | API | 用途 |
| :--- | :--- | :--- |
| `layouts/default.vue` | `useFirebase.signOut` | ログアウト |
| `AppBarNotification.vue` | `getReminderList` | 期日が来たリマインダーの取得・通知表示 |
| `AppBarNotification.vue` | `checkReminder` | リマインダーのチェック（消化 / plan 化） |

---

## LOGIN（`/login`）🔓

**できること**

- メールアドレス + パスワードでログイン
- デモログイン（「デモページ」ボタン、またはデモ用の email/password 入力）
- パスワード再設定メールの送信
- （現状 UI 非表示）アカウント新規登録・本人確認メール送信
- とりせつ（Notion）を別タブで開く

**呼び出す API**

| API | 用途 |
| :--- | :--- |
| `useFirebase.signInByUserLogin` | 通常ログイン |
| `useFirebase.signInByDemoLogin` | デモログイン |
| `useFirebase.signUp` | 新規登録（現状 UI 非表示） |
| `useFirebase.sendPasswordResetEmail` | パスワード再設定メール送信 |
| `getPairId` | ログイン成功後、ユーザの pair_id を取得し authStore に格納 |

**遷移**: ログイン成功 → `calendar`

---

## CALENDAR（`/calendar`）🔒🤝 — ホーム画面

**できること**

- 月次カレンダー表示（FullCalendar）。月の収支合計を表示。スワイプ/ページャで月移動
- 日付クリックでその日の record 一覧を表示
- 全 record の一覧表示（昇順/降順トグル）
- TODO（memo）の追加・削除（ペアの場合は共有 TODO も可）
- ショートカットからのワンタップ記録追加
- record カードから編集画面（note）へ遷移
- 「記録＋」で記録作成、「予定＋」で予定作成へ遷移
- カレンダー上の plan / reminder イベントのクリックで詳細表示、plan の編集・削除

**呼び出す API**

| API | 呼び出し経路 | 用途 |
| :--- | :--- | :--- |
| `postRecords` | `useCalendarStore.updateRange` | planned_record から未登録 record を補完登録（表示月が現在+7ヶ月以前のとき） |
| `getMonthSum` | `useCalendarStore.updateRange` | 月の収支合計取得 |
| `getRecordList` | `useCalendarStore.updateRange` | 表示範囲の record 取得 |
| `getPlanList` | `useCalendarStore.updateRange` | plan（予定）取得 |
| `getReminderList` | `useCalendarStore.updateRange` | reminder 取得 |
| `getMemoList` | 直接 | TODO 一覧取得 |
| `insertMemo` | 直接 | TODO 追加 |
| `deleteMemo` | 直接 | TODO 削除 |
| `getShortCutList` | 直接 | ショートカット一覧取得 |
| `upsertRecord` | 直接 | ショートカットからの record 登録 |
| `deletePlan` | 直接 | plan 削除 |

**遷移**: `note`（記録作成/編集）、`plan`（予定作成/編集）

---

## NOTE（`/note`）🔒🤝 — 記録入力画面

record（実績）と planned_record（定期）を、同一 UI で登録・編集・削除する。
遷移元の query key（`RECORD` / `PLANNED_RECORD`）で record か planned_record かが決まる。

**できること**

- 支出/収入の切り替え
- カテゴリ(type)・サブカテゴリ(sub_type)の選択
- 支払/受取方法(method)の選択
- 🤝 ペア時: 「立替」チェックで立替 record として登録
- 日付選択（record）／毎月何日か(day_classification)の選択（planned_record）
- メモ・金額の入力
- 登録 / 変更 / 削除

**呼び出す API**

| API | 用途 |
| :--- | :--- |
| `getTypeList` | カテゴリ一覧（created 時） |
| `getMethodList` | 方法一覧（created 時） |
| `getDayClassificationList` | 毎月何日かの選択肢（planned_record 編集時のみ） |
| `upsertRecord` | record 登録・更新 |
| `deleteRecord` | record 削除 |
| `upsertPlannedRecord` | planned_record 登録・更新 |
| `deletePlannedRecord` | planned_record 削除（紐づく record があると FK エラーで削除不可） |

**遷移**: record 保存/削除 → `calendar`（`focus` 付き） / planned_record 保存/削除 → `setting`

---

## SUMMARY（`/summary`）🔒🤝 — 集計画面

タブ構成。各タブはサブコンポーネントが担当し、API 呼び出しもそこで行う。

| タブ | サブコンポーネント | 内容 |
| :--- | :--- | :--- |
| 内訳 | `SummaryPie.vue` | 月次のカテゴリ別/方法別の円グラフ＋一覧 |
| 推移 > 全体 | `SummaryBar.vue` | 年次の月別 支出/収支 棒グラフ＋テーブル |
| 推移 > カテゴリ別 | `SummaryBarType.vue` | 年次のカテゴリ別/サブカテゴリ別 積み上げ棒グラフ |
| 精算 🤝 | `SummarySettlement.vue` | ペア間の立替精算（`isExistPair` 時のみタブ表示） |

**各サブコンポーネントの API**

| コンポーネント | API | 用途 |
| :--- | :--- | :--- |
| `SummaryPie` | `getTypeSummary` | カテゴリ別月次集計（isType=true） |
| `SummaryPie` | `getMethodSummary` | 方法別月次集計（isType=false） |
| `SummaryBar` | `getPayAndIncomeList` | 年次の月別 支出/収入 |
| `SummaryBarType` | `getTypeList` | カテゴリ一覧（チップ表示用） |
| `SummaryBarType` | `getTypeSummaryPeriod` | 年次カテゴリ別集計（「全て」選択時） |
| `SummaryBarType` | `getSubTypeSummary` | 年次サブカテゴリ別集計（カテゴリ選択時） |
| `SummarySettlement` | `getPairedRecordList` | ペアの record 一覧（立替/精算対象） |
| `SummarySettlement` | `getMethodList` | 精算方法の選択肢 |
| `SummarySettlement` | `createSettlementRecord` | 精算 record の作成 |
| `SummarySettlement` | `settleRecords` | 対象 record を精算済みに更新 |

**遷移**: `SummaryPie` の一覧項目「＞」→ `records`（該当カテゴリ/方法の明細）

---

## RECORDS（`/records`）🔒🤝 — record 明細画面

summary（内訳）から遷移し、選択したカテゴリ/方法・月に属する record を一覧表示する。
遷移パラメータ（`RECORDS_QUERY_PARAM`）が無い場合は不正遷移として `summary` に戻す。

**できること**

- 指定条件の record を月ごとに一覧表示、合計を表示
- 月の前後移動
- record カードから編集画面（note）へ遷移
- 「＜」で summary（内訳）へ戻る

**呼び出す API**

| API | 用途 |
| :--- | :--- |
| `getSummarizedRecordList` | 条件（isPay/isType/isPair/立替込み/id/subtypeId/月）に合致する record 一覧 |

**遷移**: `note`（編集）、`summary`（戻る）

---

## PLAN（`/plan`）🔒🤝 — 予定入力画面

**できること**

- 予定名・メモの入力
- 単日 / 期間指定の日付選択
- 予定カテゴリ(plan_type)の選択
- 登録 / 変更 / 削除

**呼び出す API**

| API | 用途 |
| :--- | :--- |
| `getPlanTypeList` | 予定カテゴリ一覧（created 時） |
| `upsertPlan` | plan 登録・更新 |
| `deletePlan` | plan 削除 |

**遷移**: 保存/削除 → `calendar`（`focus` 付き）

---

## BANK（`/bank`）🔒 — 口座残高画面

※ ペアモードでは設定の口座管理が無効なため、個人向けの機能。

**できること**

- 口座残高の推移を折れ線グラフ（積み上げ）で表示
- 記録日 × 口座ごとの残高テーブル表示（未登録は前回値を引き継ぎ、合計を万円単位表示）
- 「履歴＋」ダイアログから残高履歴を追加

**呼び出す API**

| API | 呼び出し経路 | 用途 |
| :--- | :--- | :--- |
| `getBankList` | 直接 | 口座一覧 |
| `getBankBalanceList` | 直接 | 残高履歴一覧 |
| `postBankBalances` | `BankBalanceDialog.vue` | 残高履歴の追加登録 |

---

## SETTING（`/setting`）🔒🤝 — 設定画面

3 タブ構成。各設定項目はサブコンポーネント（`components/setting/`）が担当。

| タブ | サブコンポーネント | 内容 |
| :--- | :--- | :--- |
| 家計管理 | `KakeiType` | 支出/収入カテゴリ・サブカテゴリの追加/編集/削除/並び替え |
| 家計管理 | `KakeiMethod` | 支払/受取方法の追加/編集/削除/並び替え |
| 家計管理 | `KakeiBank`（非ペア時のみ） | 口座の追加/編集/削除 |
| 家計管理 | `KakeiPlannedRecord` | 定期(planned_record)の一覧表示/並び替え（編集は note 画面へ） |
| 予定管理 | `PlanType` | 予定カテゴリの追加/編集/削除/並び替え |
| 予定管理 | `PlanReminder` | リマインダーの追加/削除 |
| その他 | `General` | アカウント削除など |

**呼び出す API**

| コンポーネント | API | 用途 |
| :--- | :--- | :--- |
| `setting.vue` | `getColorClassificationList` | 色マスタ取得（各設定で共通利用） |
| `KakeiType` | `getTypeList` / `upsertType` / `deleteType` / `swapType` | カテゴリ CRUD・並び替え |
| `KakeiType` | `upsertSubType` / `deleteSubType` / `swapSubType` | サブカテゴリ CRUD・並び替え |
| `KakeiMethod` | `getMethodList` / `upsertMethod` / `deleteMethod` / `swapMethod` | 方法 CRUD・並び替え |
| `KakeiBank` | `getBankList` / `upsertBank` / `deleteBank` | 口座 CRUD |
| `KakeiPlannedRecord` | `getPlannedRecordList` / `swapPlannedRecord` | 定期一覧・並び替え |
| `PlanType` | `getPlanTypeList` / `upsertPlanType` / `deletePlanType` / `swapPlanType` | 予定カテゴリ CRUD・並び替え |
| `PlanReminder` | `getReminderList` / `insertReminder` / `deleteReminder` | リマインダー取得・追加・削除 |
| `General` | `useFirebase.signOut` / `useFirebase.deleteUser` | ログアウト・アカウント削除 |

**遷移**: `KakeiPlannedRecord` の項目タップ → `note`（定期の編集） / `General` アカウント削除 → `login`

---

## INQUIRY（`/inquiry`）🔓

- 静的な案内文の表示のみ。API 呼び出しなし（TODO: 内容差し替え予定）。

## INDEX（`/`）

- 表示されない想定のリダイレクト用ページ。ログイン時は middleware で `calendar` へ誘導。
