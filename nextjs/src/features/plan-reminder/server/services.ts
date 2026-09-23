import 'server-only';
import { cache } from 'react';
import { withDemoRead, withDemoWriteVoid } from '@/features/demo/server/inject';
import * as demoPlanReminder from '@/features/demo/server/queries/plan-reminder';
import { isForeignKeyError } from '@/lib/server/db/errors';
import { resolveOwner } from '@/lib/server/pair/owner';
import { todayJst } from '@/lib/shared/domain/date';
import type { SessionData } from '@/lib/shared/types/auth';
import type { Id } from '@/lib/shared/types/id';
import { err, ok, type Result } from '@/lib/shared/types/result';
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
import * as planRepo from './repositories/plan';
import * as planTypeRepo from './repositories/plan-type';
import * as reminderRepo from './repositories/reminder';

function toDeleteError(error: unknown): PlanReminderError {
  return isForeignKeyError(error) ? 'foreignKey' : 'unknown';
}

export async function getPlanTypeCardList(
  session: SessionData
): Promise<GroupedPlanTypeList> {
  return withDemoRead(
    session,
    () => demoPlanReminder.getPlanTypeCardList(session),
    async () => {
      const rows = await planTypeRepo.findPlanTypeRows(session);
      return groupPlanTypeList(rows);
    }
  );
}

export async function getPlanList(
  session: SessionData,
  range: { start: string; end: string }
): Promise<PlanItem[]> {
  return withDemoRead(
    session,
    () => demoPlanReminder.getPlanList(session, range),
    async () => {
      const rows = await planRepo.findPlanRows(session, range);
      return toPlanItems(rows);
    }
  );
}

// plan 編集画面（/plan?planId=）のプリフィル用に plan 1 件を取得する。
// scope 外・不存在は null（呼び出し側で新規扱いにするかを決める）。
// PlanRow は PlanItem と同形のためそのまま返す（toPlanItems は配列整形のみで単件は不要）。
export async function getPlanForEdit(
  session: SessionData,
  id: Id
): Promise<PlanItem | null> {
  return withDemoRead(
    session,
    () => demoPlanReminder.getPlanForEdit(session, id),
    () => planRepo.findPlanForEdit(session, id)
  );
}

// reminder 一覧は 1 リクエスト内で複数箇所から呼ばれる（共通レイアウトの通知ベル用
// dueReminders と、setting/calendar の各 page）。getSessionData と同じく React cache()
// で per-request メモ化し、findReminderRows の DB クエリ二重発行を防ぐ。
// 呼び出し側の session はいずれも getSessionData（cache 済み）由来の同一参照のため
// キーが一致してヒットする。
export const getReminderList = cache(
  async (session: SessionData): Promise<GroupedReminderList> => {
    return withDemoRead(
      session,
      () => demoPlanReminder.getReminderList(session),
      async () => {
        const rows = await reminderRepo.findReminderRows(session);
        return groupReminderList(rows);
      }
    );
  }
);

export async function upsertPlanType(
  session: SessionData,
  input: { id?: Id; name: string; colorId: Id; isPair: boolean }
): Promise<Result<void, PlanReminderError>> {
  const owner = resolveOwner(session, input.isPair);
  if (!owner.ok) {
    return owner;
  }
  return withDemoWriteVoid(session, async () => {
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
  return withDemoWriteVoid(session, async () => {
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
  return withDemoWriteVoid(session, async () => {
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
  return withDemoWriteVoid(session, async () => {
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
  return withDemoWriteVoid(session, async () => {
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
  return withDemoWriteVoid(session, async () => {
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
  return withDemoWriteVoid(session, async () => {
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
  return withDemoWriteVoid(session, async () => {
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
    // 予定として残す。MONTH_DAY（月日指定）では Stock でも plan を作らない
    // （＝余分な予定を作らない）。
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
