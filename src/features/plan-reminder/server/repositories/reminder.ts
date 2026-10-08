import 'server-only';
import { and, asc, eq } from 'drizzle-orm';
import { db } from '@/lib/server/db/client';
import {
  colorClassifications,
  conditions,
  reminders
} from '@/lib/server/db/schema';
import { buildScopeWhere } from '@/lib/shared/db/scope';
import { dateOnlyValueJst, toDateStringJst } from '@/lib/shared/domain/date';
import type { SessionScope } from '@/lib/shared/types/auth';
import type { Id } from '@/lib/shared/types/id';

// reminder / condition リポジトリ。reminder は必ず condition（発生条件）を伴い、
// 作成・削除は 2 テーブルにまたがるためトランザクションで原子性を担保する。

// 画面用の reminder 行（condition と色名を結合）。
export type ReminderRow = {
  id: Id;
  name: string;
  date: string;
  memo: string | null;
  colorClassificationId: Id;
  colorName: string;
  pairId: Id | null;
  conditionId: Id;
  conditionType: number;
  month: number | null;
  monthDay: string | null;
  baseType: number | null;
};

// 一覧・単一取得で共通の select（condition と色名を結合）。
const reminderColumns = {
  id: reminders.id,
  name: reminders.name,
  date: reminders.date,
  memo: reminders.memo,
  colorClassificationId: reminders.colorClassificationId,
  colorName: colorClassifications.name,
  pairId: reminders.pairId,
  conditionId: reminders.conditionId,
  conditionType: conditions.conditionType,
  month: conditions.month,
  monthDay: conditions.monthDay,
  baseType: conditions.baseType
} as const;

function selectReminders() {
  return db
    .select(reminderColumns)
    .from(reminders)
    .innerJoin(conditions, eq(reminders.conditionId, conditions.id))
    .innerJoin(
      colorClassifications,
      eq(reminders.colorClassificationId, colorClassifications.id)
    );
}

// date だけ YYYY-MM-DD へ落とす（他の列は ReminderRow と同じ形で引いている）。
function toReminderRow(
  row: Omit<ReminderRow, 'date'> & { date: Date }
): ReminderRow {
  return { ...row, date: toDateStringJst(row.date) };
}

// READ。reminder + condition + color を結合し color_classification_id 昇順で返す。
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
// 次回日付計算に必要な列も返す（check で再取得しない）。
export async function findReminderInScope(
  scope: SessionScope,
  id: Id
): Promise<ReminderRow | null> {
  const [row] = await selectReminders()
    .where(and(eq(reminders.id, id), buildScopeWhere(reminders, scope)))
    .limit(1);
  return row ? toReminderRow(row) : null;
}

// CREATE（2 テーブル跨ぎ）。condition を作り、その id で reminder を作る。
// 片方だけ成功する不整合を防ぐためトランザクションで 2 行をまとめて insert する。
export async function insertReminderWithCondition(input: {
  name: string;
  date: string;
  memo: string | null;
  colorClassificationId: Id;
  userId: string | null;
  pairId: Id | null;
  condition: {
    conditionType: number;
    month: number | null;
    monthDay: string | null;
    baseType: number | null;
  };
}): Promise<void> {
  await db.transaction(async (tx) => {
    const [condition] = await tx
      .insert(conditions)
      .values({
        conditionType: input.condition.conditionType,
        month: input.condition.month,
        monthDay: input.condition.monthDay,
        baseType: input.condition.baseType
      })
      .returning({ id: conditions.id });
    await tx.insert(reminders).values({
      name: input.name,
      conditionId: condition.id,
      date: dateOnlyValueJst(input.date),
      memo: input.memo,
      colorClassificationId: input.colorClassificationId,
      userId: input.userId,
      pairId: input.pairId
    });
  });
}

// DELETE（2 テーブル跨ぎ）。reminder → condition の順で消す（FK 依存の逆順）。
export async function deleteReminderWithCondition(input: {
  reminderId: Id;
  conditionId: Id;
}): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(reminders).where(eq(reminders.id, input.reminderId));
    await tx.delete(conditions).where(eq(conditions.id, input.conditionId));
  });
}

// CHECK（消化処理）。次回日付は service 層（ドメイン計算）で算出済みを受ける。
export async function checkReminderUpdate(input: {
  reminderId: Id;
  nextDate: string;
}): Promise<void> {
  await db
    .update(reminders)
    .set({ date: dateOnlyValueJst(input.nextDate) })
    .where(eq(reminders.id, input.reminderId));
}
