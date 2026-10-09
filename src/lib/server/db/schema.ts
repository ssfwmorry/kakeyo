import {
  bigserial,
  boolean,
  date,
  integer,
  jsonb,
  pgTable,
  serial,
  smallint,
  text,
  timestamp,
  varchar
} from 'drizzle-orm/pg-core';

// テーブル定義（実 DB からの introspect を正とする）。
//
// スキーマ修飾（develop / public）は接続時の search_path で行うため、ここでは
// pgSchema を使わず素の pgTable で書く（client.ts が接続オプションで指定する）。
//
// 型の方針:
// - timestamptz は mode: 'date'（Date で受け、日付境界は domain/date.ts が JST で解釈する）
// - date も mode: 'date'。pg はプロセス TZ でパースするが、toDateStringJst を
//   通せば JST 暦日は一致する
// - bigint PK は文字列で返るため、リポジトリ境界で Number() に変換する（公開型は常に number）

export const dayClassifications = pgTable('day_classifications', {
  id: smallint('id').primaryKey(),
  name: varchar('name', { length: 10 }).notNull(),
  value: smallint('value').notNull()
});

export const colorClassifications = pgTable('color_classifications', {
  id: smallint('id').primaryKey(),
  name: varchar('name', { length: 20 }).notNull()
});

export const users = pgTable('users', {
  uid: varchar('uid', { length: 28 }).primaryKey(),
  mail: varchar('mail', { length: 100 }).notNull(),
  name: varchar('name', { length: 10 }).notNull(),
  supabaseUserUid: varchar('supabase_user_uid')
});

export const pairs = pgTable('pairs', {
  id: serial('id').primaryKey(),
  user1Id: varchar('user1_id', { length: 28 }).notNull(),
  user2Id: varchar('user2_id', { length: 28 }).notNull()
});

export const methods = pgTable('methods', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 28 }),
  pairId: integer('pair_id'),
  name: varchar('name', { length: 10 }).notNull(),
  // 送金方法（精算）では null。
  isPay: boolean('is_pay'),
  colorClassificationId: smallint('color_classification_id').notNull(),
  sort: serial('sort')
});

export const types = pgTable('types', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 28 }),
  pairId: integer('pair_id'),
  name: varchar('name', { length: 10 }).notNull(),
  isPay: boolean('is_pay').notNull(),
  colorClassificationId: smallint('color_classification_id').notNull(),
  sort: serial('sort')
});

export const subTypes = pgTable('sub_types', {
  id: serial('id').primaryKey(),
  typeId: integer('type_id').notNull(),
  name: varchar('name', { length: 10 }).notNull(),
  sort: serial('sort')
});

export const records = pgTable('records', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  // record_type=10(PAIR/共有財布) は作成者に帰属しないため NULL。
  userId: varchar('user_id', { length: 28 }),
  pairId: integer('pair_id'),
  datetime: timestamp('datetime', {
    withTimezone: true,
    mode: 'date'
  }).notNull(),
  isPay: boolean('is_pay'),
  methodId: integer('method_id').notNull(),
  typeId: integer('type_id'),
  subTypeId: integer('sub_type_id'),
  price: integer('price').notNull(),
  memo: text('memo'),
  plannedRecordId: integer('planned_record_id'),
  isSettled: boolean('is_settled'),
  recordType: smallint('record_type').default(0).notNull()
});

export const plannedRecords = pgTable('planned_records', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 28 }),
  pairId: integer('pair_id'),
  dayClassificationId: smallint('day_classification_id').notNull(),
  isPay: boolean('is_pay').notNull(),
  methodId: integer('method_id').notNull(),
  typeId: integer('type_id').notNull(),
  subTypeId: integer('sub_type_id'),
  price: integer('price').notNull(),
  memo: text('memo'),
  sort: serial('sort'),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
  recordType: smallint('record_type').default(0).notNull()
});

export const plans = pgTable('plans', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 28 }),
  pairId: integer('pair_id'),
  startDate: date('start_date', { mode: 'date' }).notNull(),
  endDate: date('end_date', { mode: 'date' }).notNull(),
  planTypeId: integer('plan_type_id').notNull(),
  name: varchar('name', { length: 30 }).notNull(),
  memo: text('memo')
});

export const planTypes = pgTable('plan_types', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 28 }),
  name: varchar('name', { length: 10 }).notNull(),
  colorClassificationId: smallint('color_classification_id').notNull(),
  sort: serial('sort'),
  pairId: integer('pair_id')
});

export const memos = pgTable('memos', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 28 }),
  pairId: integer('pair_id'),
  memo: varchar('memo', { length: 30 }).notNull()
});

export const banks = pgTable('banks', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 28 }).notNull(),
  name: varchar('name', { length: 30 }).notNull(),
  colorClassificationId: smallint('color_classification_id').notNull()
});

export const bankBalances = pgTable('bank_balances', {
  id: serial('id').primaryKey(),
  bankId: integer('bank_id').notNull(),
  price: integer('price').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull()
});

export const reminders = pgTable('reminders', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 28 }),
  pairId: integer('pair_id'),
  name: varchar('name', { length: 10 }).notNull(),
  // 繰り返し条件。形は ReminderRule（判別共用体）が正。
  rule: jsonb('rule').notNull(),
  date: date('date', { mode: 'date' }).notNull(),
  memo: text('memo'),
  colorClassificationId: smallint('color_classification_id').notNull()
});
