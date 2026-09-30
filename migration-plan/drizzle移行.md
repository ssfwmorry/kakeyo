# かけよ Prisma → Drizzle ORM 移行計画

- **作成日**: 2026-09-30
- **位置づけ**: Prisma（`@prisma/adapter-pg`）から Drizzle ORM への移行。
  Next.js 移行の残タスク（[残タスク.md](./残タスク.md)）とは独立した技術移行。
- **凍結ルール（scope / セッション / デモ注入 / Result 型）の正**: [AGENTS.md](../AGENTS.md)
  ここに書かれた規約は移行後も**そのまま維持する**。本書はその規約を Drizzle でどう実現するかを決める。
- **凡例**: 🔴=着手前に決めること / 🟡=移行作業 / 🔵=要確認 / ✅=完了条件

---

## 0. 背景：なぜ移行するか

`@prisma/adapter-pg` の `timestamptz` パーサに欠陥がある。

```js
// node_modules/@prisma/adapter-pg/dist/index.js:310
function normalize_timestamptz(time) {
  return time.replace(" ", "T").replace(/[+-]\d{2}(:\d{2})?$/, "+00:00");
}
```

オフセットを**換算せず文字列置換**するため、PG セッションが JST だと
`2026-09-27 16:05:14+09` → `2026-09-27T16:05:14+00:00` となり **Date が +9h ずれる**。
実害として「JST 15:00 以降に登録した record がカレンダーの翌日セルに入る」不具合が出た。

### 調査済みの事実（再調査不要）

- **バージョンアップでは直らない**。6.10.1 / 7.0.0 / 7.10.0（現行）/ 8.1.0-dev.7（最新）を
  実際に展開して確認。dev.7 でも該当コードは**バイト単位で同一**。
- **Prisma スキーマでは制御できない**。`records.datetime` は既に `@db.Timestamptz()` と
  明示済み。adapter は **PG の wire OID（1184）** でパーサを決めており、スキーマ宣言は
  この分岐に一切関与しない（`index.js:687-691` の `getTypeParser` フック）。
- **素の `pg` は正しい**。`pg-types` → `postgres-date` はオフセットを正しく換算する。
  検証済み: `'2026-09-27 16:05:14+09'` → `2026-09-27T07:05:14.000Z` ✅
  **Drizzle は `pg` をそのまま使うため、この不具合は構造的に発生しない。**

### 現在入っている回避策（移行時に撤去する）

不具合は既に塞いである。移行は**この回避策を不要にする**のが目的で、緊急性はない。

| 箇所 | 内容 | 移行後 |
|---|---|---|
| [client.ts](../src/lib/server/db/client.ts) | `options: '-c timezone=UTC'` でセッション TZ 固定 | **撤去可**（下記 🔴 で判断） |
| [summary.ts](../src/features/summary/server/repositories/summary.ts) | `cast(datetime at time zone 'Asia/Tokyo' as date)` ×10 | **維持**（TZ 非依存にする意味は残る） |
| [planned-record/services.ts](../src/features/planned-record/server/services.ts) | 同上 ×2 + INSERT の `at time zone` | **維持** |

---

## 1. 🔴 着手前に決めること

### 1-1. セッション TZ 固定を撤去するか

Drizzle にすればドライバは正しく動くので `options: '-c timezone=UTC'` は**不要**になる。
ただし撤去すると raw SQL の `cast(... as date)` が**接続先の TZ 設定に依存**する状態へ戻る。

**推奨**: 撤去したうえで、SQL 側の `at time zone 'Asia/Tokyo'` 明示は**全て残す**。
明示してあれば接続先 TZ が何であっても JST 暦日で一定になり、カレンダー
（`toDateStringJst`）と同じ基準を保てる。

### 1-2. スキーマ定義の作り方

現状は **introspection 運用**（`prisma/migrations` が無く、`schema.prisma` は
`db pull` 相当で実 DB から起こしたもの）。DB のスキーマ変更は Drizzle 移行の対象外。

- **推奨**: `drizzle-kit pull`（introspect）で実 DB から `schema.ts` を生成し、
  **マイグレーション機能は使わない**（`drizzle-kit push` / `generate` を運用に入れない）。
  現状の運用をそのまま踏襲でき、移行のリスクを最小化できる。
- スキーマは `develop` / `public` の 2 系統がある（`SUPABASE_DATABASE_SCHEMA`）。
  Drizzle の `pgSchema()` で動的に切り替える必要がある → **1-3 と関連**。

### 1-3. スキーマ修飾（develop / public）をどう実現するか

**移行で最も設計判断が要る箇所。**

現状は 2 系統ある。

1. **ORM 経由**: `PrismaPg(..., { schema })` で adapter に渡している
2. **raw SQL**: [schema-sql.ts](../src/lib/server/db/schema-sql.ts) の `schemaSql()` が
   `develop.` を `Prisma.raw` で直挿し（ホワイトリスト検証付き）

Drizzle には adapter レベルの `schema` オプションが無い。候補は 2 つ。

- **案 A: 接続時に `search_path` を設定**（`options: '-c search_path=develop'`）。
  テーブル定義は `pgTable` のまま書け、raw SQL からも修飾が不要になり
  `schema-sql.ts` を**丸ごと削除できる**。最も簡潔。
- **案 B: `pgSchema(name)` で明示**。型安全だが、スキーマ名が実行時の環境変数で
  変わるため定義を動的に組む必要があり、型付けが複雑になる。

**推奨は案 A**。ただし `search_path` は接続プール全体に効くため、
**pgbouncer（`?pgbouncer=true`）との相性を要検証**（🔵 4-1）。

### 1-4. 既存の回避策コメントの扱い

[client.ts](../src/lib/server/db/client.ts) には adapter のバグを説明する長いコメントがある。
移行で無意味になるため**削除する**。AGENTS.md のコメント規約
（「後で見たときに不明な表現となる断片情報は書かない」）に従い、
「旧は Prisma だった」という類の記述は**残さない**。

---

## 2. 移行対象の全体像（調査済み）

### 2-1. Prisma に依存しているファイル

repository 層 13 ファイル・計 **2357 行**。サービス層以上は `Result<T,E>` と DTO で
抽象化済みのため、**repository を差し替えれば上位は原則無改修**。

| ファイル | 行数 | 使用 API |
|---|---|---|
| [record.ts](../src/features/record/server/repositories/record.ts) | 554 | findMany/findFirst/create/createMany/update/updateMany/deleteMany + pair.findFirst |
| [summary.ts](../src/features/summary/server/repositories/summary.ts) | 487 | **全て `$queryRaw`**（集計 SQL） |
| [planned-record.ts](../src/features/planned-record/server/repositories/planned-record.ts) | 220 | findMany/findFirst/create/update |
| [type.ts](../src/features/type-method/server/repositories/type.ts) | 206 | type/subType の CRUD |
| [reminder.ts](../src/features/plan-reminder/server/repositories/reminder.ts) | 190 | findMany/findFirst/delete + condition.delete + plan.updateMany |
| [plan.ts](../src/features/plan-reminder/server/repositories/plan.ts) | 169 | CRUD |
| [method.ts](../src/features/type-method/server/repositories/method.ts) | 130 | CRUD |
| [plan-type.ts](../src/features/plan-reminder/server/repositories/plan-type.ts) | 107 | CRUD |
| [bank.ts](../src/features/bank/server/repositories/bank.ts) | 104 | findMany/create/updateMany/deleteMany |
| [bank-balance.ts](../src/features/bank/server/repositories/bank-balance.ts) | 64 | findMany/createMany + bank.count |
| [memo.ts](../src/features/memo/server/repositories/memo.ts) | 62 | findMany/create/deleteMany |
| [colorClassification.ts](../src/features/master/server/repositories/colorClassification.ts) | 36 | findMany |
| [dayClassification.ts](../src/features/master/server/repositories/dayClassification.ts) | 28 | findMany |

### 2-2. repository 以外で Prisma に触っている箇所

| ファイル | 内容 | 対応 |
|---|---|---|
| [client.ts](../src/lib/server/db/client.ts) | PrismaClient シングルトン | Drizzle インスタンスへ差し替え |
| [schema-sql.ts](../src/lib/server/db/schema-sql.ts) | `Prisma.raw` でスキーマ修飾 | 案 A なら**削除** |
| [errors.ts](../src/lib/server/db/errors.ts) | `PrismaClientKnownRequestError` で P2003 判定 | **要書き換え**（🟡 3-2） |
| [scope.ts](../src/lib/shared/db/scope.ts) | `{ OR: [...] }` を返す | **要書き換え**（🟡 3-3・最重要） |
| [record.ts](../src/features/record/server/repositories/record.ts) | `Prisma.RecordWhereInput` 等の型 | Drizzle の型へ |

### 2-3. 好条件（リスクを下げている要因）

- **`$transaction` の使用箇所がゼロ**。トランザクション移行という難所が無い。
- **マイグレーション未使用**（`prisma/migrations` 無し）。スキーマ管理の移行が不要。
- **スキーマは 17 モデル / 357 行**と小規模。
- repository が features 配下に**きれいに分離**されている。

### 2-4. ⚠️ 最大のリスク：repository 層にテストが無い

現在の 313 テストは**全て純粋ドメイン関数**が対象で、
**repository / server 層の自動テストは存在しない**。
つまり移行の正しさを**自動テストで担保できない**。

さらに [scope.test.ts](../src/lib/shared/db/scope.test.ts) は
`buildScopeWhere` の **Prisma 形式の戻り値**（`{ OR: [...] }`）を検証しているため、
移行で**テストごと書き換えになる**。

→ **対策は 🟡 3-3 と ✅ 5 を必ず実施すること。**

---

## 3. 🟡 移行手順

段階ごとにコミットし、各段で `pnpm check:full` と `pnpm test` を通す。

### 3-0. 準備

1. `drizzle-orm` / `drizzle-kit` を導入（`pg` は既に依存にある）。
2. `drizzle-kit pull` で実 DB から `schema.ts` を生成し、
   [schema.prisma](../prisma/schema.prisma) と**列型・nullable を突き合わせる**。
   特に次は実 DB を正とする（schema.prisma のコメント参照）:
   - `records.user_id` は **nullable**（`record_type=10` は NULL）
   - `records.datetime` は `timestamptz`、`plans.start_date` 等は `date`
3. Drizzle インスタンスを [client.ts](../src/lib/server/db/client.ts) に作る。
   **AGENTS.md の警告コメント（RLS バイパス・scope 必須）は必ず引き継ぐ。**

### 3-1. scope ヘルパの移行【最優先・情報漏洩に直結】

[scope.ts](../src/lib/shared/db/scope.ts) を Drizzle の条件式へ書き換える。

```ts
// 現状（Prisma）
{ OR: [{ userId: userUid }, { pairId }] }
// Drizzle
or(eq(records.userId, userUid), pairId !== null ? eq(records.pairId, pairId) : undefined)
```

**注意点:**

- `buildScopeWhere`（pair 共有）と `buildOwnerScopeWhere`（個人専用）の**使い分けを変えない**。
  誤選択は他ペアへの情報漏洩に直結する（AGENTS.md）。
- Prisma の `where` はテーブル非依存だったが、Drizzle の `eq()` は**カラム参照が要る**。
  テーブルごとに呼び出す形になるため、**全 13 repository の呼び出し側を確認**する。
- `pairId === null`（ペア未設定）で**自分の user_id のみ**に絞る分岐を落とさない。
  ここを落とすと全ユーザのデータが見える。
- [scope.test.ts](../src/lib/shared/db/scope.test.ts) を Drizzle 形式で**書き直す**。
  単に消さず、「ペア無し時に自分のみ」「ペア有り時に自分 or ペア」の
  **意味を検証するテストとして残す**。

### 3-2. エラー分類の移行

[errors.ts](../src/lib/server/db/errors.ts) の `isForeignKeyError` を書き換える。
Prisma の `P2003` ではなく、**PostgreSQL のネイティブエラーコード `23503`**
（foreign_key_violation）で判定する。`pg` は `err.code` にこれを載せる。

サービス層は `Result<T,E>` の `'foreignKey'` へ写す規約（AGENTS.md）なので、
**この関数の中だけ**直せば上位は無改修で済む。

### 3-3. repository の移行（小さい順）

依存の少ないものから進め、各段でビルドを通す。

1. `dayClassification.ts`(28) / `colorClassification.ts`(36) — findMany のみ。**ここで型の勘所を掴む**
2. `memo.ts`(62) / `bank-balance.ts`(64) / `bank.ts`(104)
3. `plan-type.ts`(107) / `method.ts`(130) / `plan.ts`(169)
4. `reminder.ts`(190) / `type.ts`(206) / `planned-record.ts`(220)
5. `record.ts`(554) — **最大かつ最重要**
6. `summary.ts`(487) — **全て raw SQL**

**共通の注意点:**

- **BigInt PK 境界**: `records` / `short_cuts` の PK は `BigInt`。
  リポジトリ/サービス境界で `Number(row.id)` へ変換し、公開型は常に `id: number`
  （AGENTS.md §4.1）。Drizzle でも `bigint` は文字列か BigInt で返るため、
  **変換を落とさない**。
- **`include` の置き換え**: `recordInclude`（method/type/subType/user の select）は
  Drizzle の `with`（relations 定義）か join で表現する。
  **`select` で列を絞っている意図**（マッパーが読む列だけ）を維持する。
- **更新・削除の scope**: Prisma が RLS をバイパスするため
  `updateMany`/`deleteMany` の where に scope を AND して IDOR を塞いでいる
  （`count===0` = scope 外/不存在）。**Drizzle でも同じ形を維持**し、
  `.returning()` 等で影響行数を確認する。

### 3-4. raw SQL（summary.ts）の移行

11 箇所の `$queryRaw` を Drizzle の `sql` テンプレートへ。**SQL 本文は流用できる。**

- `${schemaSql()}` の扱いは 🔴 1-3 の決定に従う（案 A なら**修飾ごと削除**）。
- `at time zone 'Asia/Tokyo'` の明示は**そのまま残す**（0. の表を参照）。
- プレースホルダの渡し方が変わる。`scope.userUid` 等が**確実にバインド変数として**
  渡ることを確認する（文字列連結にすると SQL インジェクションになる）。
- 戻り値の型注釈（`MonthSumRawRow` 等）を Drizzle 側の型へ。
  **数値型は `numeric` が文字列で返る点に注意**（`sum()` の結果など）。

### 3-5. 後片付け

- `prisma` / `@prisma/client` / `@prisma/adapter-pg` を削除。
- `package.json` の `build` から `prisma generate` を外す。
- `prisma/` ディレクトリを削除（`schema.prisma` は git 履歴に残る）。
- 🔴 1-4 の通り、Prisma 由来のコメントを**残さない**。
- [AGENTS.md](../AGENTS.md) の記述を更新（「Prisma が RLS をバイパスするため」等の
  文言は Drizzle でも実態は同じだが、**ORM 名を正しくする**）。

---

## 4. 🔵 要確認（着手前に検証する）

### 4-1. pgbouncer と `search_path` の相性【案 A を採る場合は必須】

接続文字列が `?pgbouncer=true`（transaction pooling）。この場合
**接続が毎回別のバックエンドに割り当てられうる**ため、
`-c search_path=develop` のような**セッション単位の設定が保持されるか**を検証する。

保持されない場合は 🔴 1-3 の**案 B（`pgSchema()` で明示）へ切り替える**。

> 現在入れた `options: '-c timezone=UTC'` も同じ懸念を持つ。
> **この検証は移行前に現行構成でも実施する価値がある。**

### 4-2. 他の型変換に同種の問題がないか

今回の不具合は adapter が OID 単位で挙動を上書きしていたことが原因。
`@db.Date` の列（`plans.start_date` / `plans.end_date` / `reminders.date`）にも
同種のズレが無いか、移行前後で**同じデータを読んで突き合わせる**。

関連: [date.ts](../src/lib/shared/domain/date.ts) の `dateOnlyValueJst` は
`@db.Date` 保存用に UTC 00:00 を作っている。Drizzle での往復を確認する。

### 4-3. デモ注入への影響

デモは `withDemoRead` / `withDemoWriteVoid` で**実 DB に触れない**（AGENTS.md）。
repository を差し替えても**デモ経路は無改修のはず**だが、
`features/demo/server/queries/*` が repository と**同名の関数**を持つ規約なので、
**シグネチャを変えた場合はデモ側も揃える**。

---

## ✅ 5. 完了条件

repository にテストが無い（2-4）ため、**機械的な検証だけでは不十分**。
以下を全て満たすこと。

### 5-1. 機械的検証

- [ ] `pnpm check:full`（biome + tsc）がエラーなし
- [ ] `pnpm test` が全て通過（scope.test.ts は Drizzle 形式で**書き直した上で**）
- [ ] `pnpm build` が成功

### 5-2. 新規テスト（移行で必ず追加する）

- [ ] `buildScopeWhere` / `buildOwnerScopeWhere` の**意味**を検証するテスト
      （ペア有り / 無し / 個人専用テーブル）
- [ ] `isForeignKeyError` が PG の `23503` を判定するテスト

### 5-3. 画面での動作確認【必須】

AGENTS.md の「画面の動作確認」に従う。`pnpm build && pnpm start` で起動。

- [ ] **デモログイン**（ペアあり / ペアなし の両方）で全画面を確認。
      デモは Server 層で no-op になり実 DB に副作用を与えない。
      ペアあり/なしで `session.pairId` の有無が各画面に効くため、**両方必須**。
- [ ] スクリーンショットを `.screenshots/` に連番＋画面名で保存（`.gitignore` 済み）。
- [ ] Playwright MCP（`mico-eng-basic` プラグインの `playwright`）を使う。
      単純な headless Chrome ではログイン導線を辿れず login 画面で止まる。

### 5-4. 日付ズレの回帰確認【この移行の主目的】

- [ ] **JST 15:00〜23:59 に登録した record が当日のセルに入る**ことを確認。
      これが直っていなければ移行の意味がない。
- [ ] 月初（JST 00:00〜08:59）の record が**当月の集計に入る**ことを確認。
- [ ] カレンダーの月合計と summary 画面の月合計が**一致する**ことを確認。

> ⚠️ 実データでの確認は `.env` 末尾コメントの動作確認用ユーザで通常ログインする
> （デモとは別物）。**public スキーマへの書き込みはユーザ承認が必要**（AGENTS.md）。
> 接続先は `develop` スキーマだが、書き込みを伴う確認は**事前に許可を取ること**。

### 5-5. scope の目視確認【情報漏洩防止・省略不可】

自動テストで担保しきれないため、**全 13 repository を人の目で確認する**。

- [ ] 取得系が全て `buildScopeWhere` / `buildOwnerScopeWhere` を通っている
- [ ] `updateMany` / `deleteMany` 相当の where に scope が AND されている
- [ ] `buildOwnerScopeWhere` を使うべきテーブル（`records` 以外の個人専用:
      `banks` / `bank_balances` / `short_cuts`）で**誤って pair 込みにしていない**

---

## 6. 進め方の指針（別セッションへの申し送り）

- **1 段階ずつコミットする**。repository 13 個を一括で書き換えない。
  3-3 の順序（小さい順）を守れば、型の勘所を掴んでから `record.ts` に入れる。
- **🔴 1-1〜1-4 はコードを書く前に決める**。特に 1-3（スキーマ修飾）は
  全 repository の書き方を左右するため、**先に 🔵 4-1 を検証してから**着手する。
- **scope 周りは情報漏洩に直結する**。迷ったら AGENTS.md の該当節を読み、
  それでも判断がつかなければ**ユーザに確認する**。
- 本書の「調査済みの事実」（0. と 2.）は**実際にコードとパッケージを読んで確認済み**。
  再調査は不要だが、**実 DB への接続確認は未実施**（作業環境から `ECONNREFUSED`）。
  🔵 4-1 / 4-2 と ✅ 5-3 は**実際に DB に繋がる環境で行う必要がある**。
