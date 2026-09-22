import 'server-only';
import { prisma } from '@/lib/server/db/client';
import { buildScopeWhere } from '@/lib/shared/db/scope';
import { startOfDayJst, toDateStringJst } from '@/lib/shared/domain/date';
import type { SessionScope } from '@/lib/shared/types/auth';
import type { Id } from '@/lib/shared/types/id';

// reminder / condition リポジトリ。reminder は必ず condition（発生条件）を伴い、
// 作成・削除・チェックは 2 テーブルにまたがるため $transaction で原子性を担保する
// （現行 insertReminder / deleteReminder / checkReminder を移植）。

// 画面用の reminder 行（condition と色名を結合）。
export type ReminderRow = {
  id: Id;
  name: string;
  reminderType: number;
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

// READ。reminder + condition + color を結合し color_classification_id 昇順で返す
// （現行 getReminderList 踏襲）。self/pair/all の振り分けは service 層で行う。
export async function findReminderRows(
  scope: SessionScope
): Promise<ReminderRow[]> {
  const rows = await prisma.reminder.findMany({
    where: buildScopeWhere(scope),
    include: {
      condition: true,
      colorClassification: { select: { name: true } }
    },
    orderBy: { colorClassificationId: 'asc' }
  });
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    reminderType: row.reminderType,
    date: toDateStringJst(row.date),
    memo: row.memo,
    colorClassificationId: row.colorClassificationId,
    colorName: row.colorClassification.name,
    pairId: row.pairId,
    conditionId: row.conditionId,
    conditionType: row.condition.conditionType,
    month: row.condition.month,
    monthDay: row.condition.monthDay,
    baseType: row.condition.baseType
  }));
}

// scope 検証: 指定 reminder が scope 内か。check / delete の対象確認に使う。
// 次回日付計算・plan 化に必要な列も返す（check で再取得しない）。
export async function findReminderInScope(
  scope: SessionScope,
  id: Id
): Promise<ReminderRow | null> {
  const row = await prisma.reminder.findFirst({
    where: { AND: [{ id }, buildScopeWhere(scope)] },
    include: {
      condition: true,
      colorClassification: { select: { name: true } }
    }
  });
  if (row === null) {
    return null;
  }
  return {
    id: row.id,
    name: row.name,
    reminderType: row.reminderType,
    date: toDateStringJst(row.date),
    memo: row.memo,
    colorClassificationId: row.colorClassificationId,
    colorName: row.colorClassification.name,
    pairId: row.pairId,
    conditionId: row.conditionId,
    conditionType: row.condition.conditionType,
    month: row.condition.month,
    monthDay: row.condition.monthDay,
    baseType: row.condition.baseType
  };
}

// CREATE（2 テーブル跨ぎ）。condition を作り、その id で reminder を作る。
// 現行は逐次 insert だが、片方だけ成功する不整合を防ぐため $transaction にする。
export async function insertReminderWithCondition(input: {
  name: string;
  reminderType: number;
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
  await prisma.$transaction(async (tx) => {
    const condition = await tx.condition.create({
      data: {
        conditionType: input.condition.conditionType,
        month: input.condition.month,
        monthDay: input.condition.monthDay,
        baseType: input.condition.baseType
      }
    });
    await tx.reminder.create({
      data: {
        name: input.name,
        reminderType: input.reminderType,
        conditionId: condition.id,
        date: startOfDayJst(input.date),
        memo: input.memo,
        colorClassificationId: input.colorClassificationId,
        userId: input.userId,
        pairId: input.pairId
      }
    });
  });
}

// DELETE（2 テーブル跨ぎ）。reminder → condition の順で消す（FK 依存の逆順）。
// 紐づく plan の reminder_id は FK 制約次第だが、現行同様まず reminder を消す。
export async function deleteReminderWithCondition(input: {
  reminderId: Id;
  conditionId: Id;
}): Promise<void> {
  await prisma.$transaction([
    prisma.reminder.delete({ where: { id: input.reminderId } }),
    prisma.condition.delete({ where: { id: input.conditionId } })
  ]);
}

// CHECK（現行 checkReminder）。次回日付は service 層（ドメイン計算）で算出済みを受ける。
// reminder.date を更新し、Stock 型なら plan を作る（2 テーブル跨ぎ）ため $transaction。
export async function checkReminderUpdate(input: {
  reminderId: Id;
  nextDate: string;
  // Stock 型のとき plan を作る（現行 date を start/end に据える）。null なら plan 化しない。
  plan: {
    userId: string | null;
    pairId: Id | null;
    date: string;
    name: string;
    memo: string | null;
  } | null;
}): Promise<void> {
  await prisma.$transaction(async (tx) => {
    if (input.plan !== null) {
      await tx.plan.create({
        data: {
          userId: input.plan.userId,
          pairId: input.plan.pairId,
          startDate: startOfDayJst(input.plan.date),
          endDate: startOfDayJst(input.plan.date),
          planTypeId: null,
          name: input.plan.name,
          memo: input.plan.memo,
          reminderId: input.reminderId
        }
      });
    }
    await tx.reminder.update({
      where: { id: input.reminderId },
      data: { date: startOfDayJst(input.nextDate) }
    });
  });
}
