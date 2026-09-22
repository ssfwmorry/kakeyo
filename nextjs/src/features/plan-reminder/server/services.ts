import 'server-only';
import { withDemoRead, withDemoWriteVoid } from '@/features/auth/server/demo';
import { todayJst } from '@/lib/shared/domain/date';
import type { SessionData } from '@/lib/shared/types/auth';
import type { Id } from '@/lib/shared/types/id';
import { err, ok, type Result } from '@/lib/shared/types/result';
import { Prisma } from '@/prisma/generated/client';
import {
  ConditionType,
  calcNextReminderDate,
  ReminderType
} from '../domain/reminder-condition';
import { groupPlanTypeList, groupReminderList, toPlanItems } from '../grouping';
import type {
  GroupedPlanTypeList,
  GroupedReminderList,
  PlanItem,
  PlanReminderError
} from '../types';
import { demoPlanList, demoPlanTypeList, demoReminderList } from './demo';
import * as planRepo from './repositories/plan';
import * as planTypeRepo from './repositories/plan-type';
import * as reminderRepo from './repositories/reminder';

// L5 サービス層。Result<T, PlanReminderError> を返す（UI 文言は持たない）。
// 取得は withDemoRead、更新は withDemoWriteVoid でデモ注入。
// userId / pairId は session から作りクライアント値を信用しない。

// FK 制約違反（P2003）を捕捉。それ以外は unknown。
function toDeleteError(error: unknown): PlanReminderError {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2003'
  ) {
    return 'foreignKey';
  }
  return 'unknown';
}

// isPair のとき pairId 必須。個人のとき userId のみ。作成時の所有列を決める。
function resolveOwner(
  session: SessionData,
  isPair: boolean
): Result<{ userId: string | null; pairId: Id | null }, PlanReminderError> {
  if (isPair) {
    if (session.pairId === null) {
      return err('pairRequired');
    }
    return ok({ userId: null, pairId: session.pairId });
  }
  return ok({ userId: session.userUid, pairId: null });
}

// ===== READ =====
export async function getPlanTypeCardList(
  session: SessionData
): Promise<GroupedPlanTypeList> {
  return withDemoRead(session.isDemo, demoPlanTypeList, async () => {
    const rows = await planTypeRepo.findPlanTypeRows(session);
    return groupPlanTypeList(rows);
  });
}

export async function getPlanList(
  session: SessionData,
  range: { start: string; end: string }
): Promise<PlanItem[]> {
  return withDemoRead(session.isDemo, demoPlanList, async () => {
    const rows = await planRepo.findPlanRows(session, range);
    return toPlanItems(rows);
  });
}

export async function getReminderList(
  session: SessionData
): Promise<GroupedReminderList> {
  return withDemoRead(session.isDemo, demoReminderList, async () => {
    const rows = await reminderRepo.findReminderRows(session);
    return groupReminderList(rows);
  });
}

// ===== PLAN TYPE CRUD =====
export async function upsertPlanType(
  session: SessionData,
  input: { id?: Id; name: string; colorId: Id; isPair: boolean }
): Promise<Result<void, PlanReminderError>> {
  const owner = resolveOwner(session, input.isPair);
  if (!owner.ok) {
    return owner;
  }
  return withDemoWriteVoid(session.isDemo, async () => {
    if (input.id === undefined) {
      await planTypeRepo.insertPlanType({
        name: input.name,
        colorClassificationId: input.colorId,
        userId: owner.data.userId,
        pairId: owner.data.pairId
      });
      return ok(undefined);
    }
    const target = await planTypeRepo.findPlanTypeInScope(session, input.id);
    if (!target) {
      return err('notInScope');
    }
    await planTypeRepo.updatePlanType({
      id: input.id,
      name: input.name,
      colorClassificationId: input.colorId
    });
    return ok(undefined);
  });
}

export async function deletePlanType(
  session: SessionData,
  id: Id
): Promise<Result<void, PlanReminderError>> {
  return withDemoWriteVoid(session.isDemo, async () => {
    const target = await planTypeRepo.findPlanTypeInScope(session, id);
    if (!target) {
      return err('notInScope');
    }
    try {
      await planTypeRepo.deletePlanTypeById(id);
      return ok(undefined);
    } catch (error) {
      return err(toDeleteError(error));
    }
  });
}

export async function swapPlanType(
  session: SessionData,
  prevId: Id,
  nextId: Id
): Promise<Result<void, PlanReminderError>> {
  return withDemoWriteVoid(session.isDemo, async () => {
    const [a, b] = await Promise.all([
      planTypeRepo.findPlanTypeInScope(session, prevId),
      planTypeRepo.findPlanTypeInScope(session, nextId)
    ]);
    if (!a || !b) {
      return err('notInScope');
    }
    // self(pairId=null) と pair(pairId!=null) を跨いだ入替を禁止する。
    // 一覧は [{ pairId }, { sort }] 順で、跨ぎ入替は並び順を壊す（Server Action は
    // 任意の 2 id を受けられるため service で防御する）。
    if (a.pairId !== b.pairId) {
      return err('notInScope');
    }
    await planTypeRepo.swapPlanTypeSort(a, b);
    return ok(undefined);
  });
}

// ===== PLAN CRUD =====
export async function upsertPlan(
  session: SessionData,
  input: {
    id?: Id;
    name: string;
    startDate: string;
    endDate: string;
    planTypeId: Id | null;
    memo: string | null;
    isPair: boolean;
  }
): Promise<Result<void, PlanReminderError>> {
  const owner = resolveOwner(session, input.isPair);
  if (!owner.ok) {
    return owner;
  }
  return withDemoWriteVoid(session.isDemo, async () => {
    if (input.id === undefined) {
      await planRepo.insertPlan({
        name: input.name,
        startDate: input.startDate,
        endDate: input.endDate,
        planTypeId: input.planTypeId,
        memo: input.memo,
        userId: owner.data.userId,
        pairId: owner.data.pairId
      });
      return ok(undefined);
    }
    const target = await planRepo.findPlanInScope(session, input.id);
    if (!target) {
      return err('notInScope');
    }
    await planRepo.updatePlan({
      id: input.id,
      name: input.name,
      startDate: input.startDate,
      endDate: input.endDate,
      planTypeId: input.planTypeId,
      memo: input.memo,
      userId: owner.data.userId,
      pairId: owner.data.pairId
    });
    return ok(undefined);
  });
}

export async function deletePlan(
  session: SessionData,
  id: Id
): Promise<Result<void, PlanReminderError>> {
  return withDemoWriteVoid(session.isDemo, async () => {
    const target = await planRepo.findPlanInScope(session, id);
    if (!target) {
      return err('notInScope');
    }
    try {
      await planRepo.deletePlanById(id);
      return ok(undefined);
    } catch (error) {
      return err(toDeleteError(error));
    }
  });
}

// ===== REMINDER =====
export async function insertReminder(
  session: SessionData,
  input: {
    name: string;
    reminderType: number;
    date: string;
    memo: string | null;
    colorId: Id;
    isPair: boolean;
    condition: {
      conditionType: number;
      month: number | null;
      monthDay: string | null;
      baseType: number | null;
    };
  }
): Promise<Result<void, PlanReminderError>> {
  const owner = resolveOwner(session, input.isPair);
  if (!owner.ok) {
    return owner;
  }
  return withDemoWriteVoid(session.isDemo, async () => {
    await reminderRepo.insertReminderWithCondition({
      name: input.name,
      reminderType: input.reminderType,
      date: input.date,
      memo: input.memo,
      colorClassificationId: input.colorId,
      userId: owner.data.userId,
      pairId: owner.data.pairId,
      condition: input.condition
    });
    return ok(undefined);
  });
}

export async function deleteReminder(
  session: SessionData,
  reminderId: Id
): Promise<Result<void, PlanReminderError>> {
  return withDemoWriteVoid(session.isDemo, async () => {
    // scope 内か検証し、削除に必要な condition_id もここで得る。
    const target = await reminderRepo.findReminderInScope(session, reminderId);
    if (!target) {
      return err('notInScope');
    }
    try {
      await reminderRepo.deleteReminderWithCondition({
        reminderId: target.id,
        conditionId: target.conditionId
      });
      return ok(undefined);
    } catch (error) {
      return err(toDeleteError(error));
    }
  });
}

// リマインダーのチェック（消化）。次回日付を算出して更新、Stock 型なら plan 化する。
export async function checkReminder(
  session: SessionData,
  reminderId: Id
): Promise<Result<void, PlanReminderError>> {
  return withDemoWriteVoid(session.isDemo, async () => {
    const target = await reminderRepo.findReminderInScope(session, reminderId);
    if (!target) {
      return err('notInScope');
    }
    const nextDate = calcNextReminderDate({
      conditionType: target.conditionType,
      month: target.month,
      monthDay: target.monthDay,
      baseType: target.baseType,
      currentDate: target.date,
      today: todayJst()
    });
    if (nextDate === null) {
      return err('unknown');
    }
    // Stock 型かつ conditionType=MONTH（Nヶ月後指定）のときのみ「現在の date」を
    // 予定として残す。旧 checkReminder は plan 挿入を else 節（MONTH 側）に置くため、
    // MONTH_DAY（月日指定）では Stock でも plan を作らない（＝余分な予定を作らない）。
    // 所有列は reminder の所有に合わせる（pairId があればペア、なければ本人）。
    const isStockMonth =
      target.reminderType === ReminderType.stock &&
      target.conditionType === ConditionType.month;
    const plan = isStockMonth
      ? {
          userId: target.pairId === null ? session.userUid : null,
          pairId: target.pairId,
          date: target.date,
          name: target.name,
          memo: target.memo
        }
      : null;
    await reminderRepo.checkReminderUpdate({
      reminderId: target.id,
      nextDate,
      plan
    });
    return ok(undefined);
  });
}
