import 'server-only';
import { cache } from 'react';
import {
  withDemoRead,
  withDemoWrite,
  withDemoWriteVoid
} from '@/features/demo/server/inject';
import * as demoPlanReminder from '@/features/demo/server/queries/plan-reminder';
import { isForeignKeyError } from '@/lib/server/db/errors';
import { resolveOwner } from '@/lib/server/pair/owner';
import { todayJst } from '@/lib/shared/domain/date';
import { planReorder } from '@/lib/shared/domain/reorder';
import type { SessionData } from '@/lib/shared/types/auth';
import type { Id } from '@/lib/shared/types/id';
import { err, ok, type Result } from '@/lib/shared/types/result';
import {
  calcNextReminderDate,
  type ReminderRule
} from '../domain/reminder-condition';
import { groupPlanTypeList, groupReminderList } from '../grouping';
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
    () => planRepo.findPlanRows(session, range)
  );
}

// 予定シートの編集のプリフィル用に plan 1 件を取得する。
// scope 外・不存在は null（呼び出し側で新規扱いにするかを決める）。
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

export async function upsertPlan(
  session: SessionData,
  input: {
    id?: Id;
    name: string;
    startDate: string;
    endDate: string;
    planTypeId: Id;
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
    date: string;
    memo: string | null;
    colorId: Id;
    isPair: boolean;
    rule: ReminderRule;
  }
): Promise<Result<void, PlanReminderError>> {
  const owner = resolveOwner(session, input.isPair);
  if (!owner.ok) {
    return owner;
  }
  return withDemoWriteVoid(session, async () => {
    await reminderRepo.insertReminder({
      name: input.name,
      date: input.date,
      memo: input.memo,
      colorClassificationId: input.colorId,
      userId: owner.data.userId,
      pairId: owner.data.pairId,
      rule: input.rule
    });
    return ok(undefined);
  });
}

export async function deleteReminder(
  session: SessionData,
  reminderId: Id
): Promise<Result<void, PlanReminderError>> {
  return withDemoWriteVoid(session, async () => {
    const target = await reminderRepo.findReminderInScope(session, reminderId);
    if (!target) {
      return err('notInScope');
    }
    try {
      await reminderRepo.deleteReminder(target.id);
      return ok(undefined);
    } catch (error) {
      return err(toDeleteError(error));
    }
  });
}

// リマインダーのチェック（消化）。次回日付を算出して date を進める。
// Action がトースト文言に使うので、対象の名前を返す（名前のために一覧を引き直さない）。
export async function checkReminder(
  session: SessionData,
  reminderId: Id
): Promise<Result<{ name: string }, PlanReminderError>> {
  return withDemoWrite(
    session,
    () => ({
      name:
        demoPlanReminder.findReminderInScope(session, reminderId)?.name ?? ''
    }),
    async () => {
      const target = await reminderRepo.findReminderInScope(
        session,
        reminderId
      );
      if (!target) {
        return err('notInScope');
      }
      const nextDate = calcNextReminderDate({
        rule: target.rule,
        currentDate: target.date,
        today: todayJst()
      });
      if (nextDate === null) {
        return err('unknown');
      }
      await reminderRepo.checkReminderUpdate({
        reminderId: target.id,
        nextDate
      });
      return ok({ name: target.name });
    }
  );
}

// 任意順の並べ替え。全 id が scope 内かつ同じ所有（self / pair）に揃っていることを
// 検証してから、既存の sort 値を割り当て直す。
export async function reorderPlanTypes(
  session: SessionData,
  ids: Id[]
): Promise<Result<void, PlanReminderError>> {
  return withDemoWriteVoid(session, async () => {
    const rows = await planTypeRepo.findPlanTypeRowsForReorder(session, ids);
    const plan = planReorder(rows, ids, (row) => String(row.pairId));
    if (plan === null) {
      return err('notInScope');
    }
    await planTypeRepo.updatePlanTypeSorts(plan);
    return ok(undefined);
  });
}
