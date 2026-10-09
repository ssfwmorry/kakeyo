import 'server-only';
import { and, asc, eq } from 'drizzle-orm';
import {
  parseReminderRule,
  type ReminderRule
} from '@/features/plan-reminder/domain/reminder-condition';
import { db } from '@/lib/server/db/client';
import { colorClassifications, reminders } from '@/lib/server/db/schema';
import { buildScopeWhere } from '@/lib/shared/db/scope';
import { dateOnlyValueJst, toDateStringJst } from '@/lib/shared/domain/date';
import type { SessionScope } from '@/lib/shared/types/auth';
import type { Id } from '@/lib/shared/types/id';

// reminder は pair 共有テーブル（自分 or ペアのものが見える）ため buildScopeWhere を通す。

// 画面用の reminder 行（色名を結合）。rule は読み出し時にパース済み（壊れていれば null）。
export type ReminderRow = {
  id: Id;
  name: string;
  date: string;
  memo: string | null;
  colorClassificationId: Id;
  colorName: string;
  pairId: Id | null;
  rule: ReminderRule | null;
};

const reminderColumns = {
  id: reminders.id,
  name: reminders.name,
  date: reminders.date,
  memo: reminders.memo,
  colorClassificationId: reminders.colorClassificationId,
  colorName: colorClassifications.name,
  pairId: reminders.pairId,
  rule: reminders.rule
} as const;

function selectReminders() {
  return db
    .select(reminderColumns)
    .from(reminders)
    .innerJoin(
      colorClassifications,
      eq(reminders.colorClassificationId, colorClassifications.id)
    );
}

function toReminderRow(
  row: Omit<ReminderRow, 'date' | 'rule'> & { date: Date; rule: unknown }
): ReminderRow {
  return {
    ...row,
    date: toDateStringJst(row.date),
    rule: parseReminderRule(row.rule)
  };
}

// self/pair/all の振り分けは service 層で行う。
export async function findReminderRows(
  scope: SessionScope
): Promise<ReminderRow[]> {
  const rows = await selectReminders()
    .where(buildScopeWhere(reminders, scope))
    .orderBy(asc(reminders.colorClassificationId));
  return rows.map(toReminderRow);
}

// scope 検証: 指定 reminder が scope 内か。check / delete の対象確認に使う。
// 次回日付計算に必要な rule も返す（check で再取得しない）。
export async function findReminderInScope(
  scope: SessionScope,
  id: Id
): Promise<ReminderRow | null> {
  const [row] = await selectReminders()
    .where(and(eq(reminders.id, id), buildScopeWhere(reminders, scope)))
    .limit(1);
  return row ? toReminderRow(row) : null;
}

export async function insertReminder(input: {
  name: string;
  date: string;
  memo: string | null;
  colorClassificationId: Id;
  userId: string | null;
  pairId: Id | null;
  rule: ReminderRule;
}): Promise<void> {
  await db.insert(reminders).values({
    name: input.name,
    rule: input.rule,
    date: dateOnlyValueJst(input.date),
    memo: input.memo,
    colorClassificationId: input.colorClassificationId,
    userId: input.userId,
    pairId: input.pairId
  });
}

// DELETE。scope は呼び出し側（service）が findReminderInScope で確認済み。
export async function deleteReminder(reminderId: Id): Promise<void> {
  await db.delete(reminders).where(eq(reminders.id, reminderId));
}

// 次回日付は service 層（ドメイン計算）で算出済みを受ける。
export async function checkReminderUpdate(input: {
  reminderId: Id;
  nextDate: string;
}): Promise<void> {
  await db
    .update(reminders)
    .set({ date: dateOnlyValueJst(input.nextDate) })
    .where(eq(reminders.id, input.reminderId));
}
