import 'server-only';
import { withDemoRead, withDemoWriteVoid } from '@/features/demo/server/inject';
import * as demoTypeMethod from '@/features/demo/server/queries/type-method';
import { getColorClassificationList } from '@/features/master/server/repositories/colorClassification';
import { isForeignKeyError } from '@/lib/server/db/errors';
import { resolveOwner } from '@/lib/server/pair/owner';
import { planReorder } from '@/lib/shared/domain/reorder';
import type { SessionData } from '@/lib/shared/types/auth';
import type { Id } from '@/lib/shared/types/id';
import { err, ok, type Result } from '@/lib/shared/types/result';
import { groupMethodList, groupTypeList } from '../grouping';
import type {
  GroupedMethodList,
  GroupedTypeList,
  TypeMethodError
} from '../types';
import * as methodRepo from './repositories/method';
import * as typeRepo from './repositories/type';

function toDeleteError(error: unknown): TypeMethodError {
  return isForeignKeyError(error) ? 'foreignKey' : 'unknown';
}

export async function getTypeCardList(
  session: SessionData
): Promise<GroupedTypeList> {
  return withDemoRead(
    session,
    () => demoTypeMethod.getTypeCardList(session),
    async () => {
      const [rows, colors] = await Promise.all([
        typeRepo.findTypeRows(session),
        getColorClassificationList()
      ]);
      return groupTypeList(rows, colors);
    }
  );
}

export async function getMethodCardList(
  session: SessionData
): Promise<GroupedMethodList> {
  return withDemoRead(
    session,
    () => demoTypeMethod.getMethodCardList(session),
    async () => {
      const [rows, colors] = await Promise.all([
        methodRepo.findMethodRows(session),
        getColorClassificationList()
      ]);
      return groupMethodList(rows, colors);
    }
  );
}

export async function upsertType(
  session: SessionData,
  input: {
    id?: Id;
    name: string;
    colorId: Id;
    isPay: boolean;
    isPair: boolean;
  }
): Promise<Result<void, TypeMethodError>> {
  const owner = resolveOwner(session, input.isPair);
  if (!owner.ok) {
    return owner;
  }
  return withDemoWriteVoid(session, async () => {
    if (input.id === undefined) {
      await typeRepo.insertType({
        name: input.name,
        isPay: input.isPay,
        colorClassificationId: input.colorId,
        userId: owner.data.userId,
        pairId: owner.data.pairId
      });
      return ok(undefined);
    }
    // 更新は対象が scope 内か検証してから（他ペアの行を触らせない）。
    const target = await typeRepo.findTypeInScope(session, input.id);
    if (!target) {
      return err('notInScope');
    }
    await typeRepo.updateType({
      id: input.id,
      name: input.name,
      colorClassificationId: input.colorId
    });
    return ok(undefined);
  });
}

export async function deleteType(
  session: SessionData,
  id: Id
): Promise<Result<void, TypeMethodError>> {
  return withDemoWriteVoid(session, async () => {
    const target = await typeRepo.findTypeInScope(session, id);
    if (!target) {
      return err('notInScope');
    }
    try {
      await typeRepo.deleteTypeById(id);
      return ok(undefined);
    } catch (error) {
      return err(toDeleteError(error));
    }
  });
}

export async function upsertSubType(
  session: SessionData,
  input: { id?: Id; typeId: Id; name: string }
): Promise<Result<void, TypeMethodError>> {
  return withDemoWriteVoid(session, async () => {
    if (input.id === undefined) {
      // 親 type が scope 内か検証してから作成する。
      const parent = await typeRepo.findTypeInScope(session, input.typeId);
      if (!parent) {
        return err('notInScope');
      }
      await typeRepo.insertSubType({ typeId: input.typeId, name: input.name });
      return ok(undefined);
    }
    const target = await typeRepo.findSubTypeInScope(session, input.id);
    if (!target) {
      return err('notInScope');
    }
    await typeRepo.updateSubType({ id: input.id, name: input.name });
    return ok(undefined);
  });
}

export async function deleteSubType(
  session: SessionData,
  id: Id
): Promise<Result<void, TypeMethodError>> {
  return withDemoWriteVoid(session, async () => {
    const target = await typeRepo.findSubTypeInScope(session, id);
    if (!target) {
      return err('notInScope');
    }
    try {
      await typeRepo.deleteSubTypeById(id);
      return ok(undefined);
    } catch (error) {
      return err(toDeleteError(error));
    }
  });
}

// payMode を isPay(true/false/null) に写す。both = 精算 = null。
function toMethodIsPay(payMode: 'pay' | 'income' | 'both'): boolean | null {
  if (payMode === 'both') {
    return null;
  }
  return payMode === 'pay';
}

export async function upsertMethod(
  session: SessionData,
  input: {
    id?: Id;
    name: string;
    colorId: Id;
    payMode: 'pay' | 'income' | 'both';
    isPair: boolean;
  }
): Promise<Result<void, TypeMethodError>> {
  const owner = resolveOwner(session, input.isPair);
  if (!owner.ok) {
    return owner;
  }
  return withDemoWriteVoid(session, async () => {
    if (input.id === undefined) {
      await methodRepo.insertMethod({
        name: input.name,
        isPay: toMethodIsPay(input.payMode),
        colorClassificationId: input.colorId,
        userId: owner.data.userId,
        pairId: owner.data.pairId
      });
      return ok(undefined);
    }
    const target = await methodRepo.findMethodInScope(session, input.id);
    if (!target) {
      return err('notInScope');
    }
    await methodRepo.updateMethod({
      id: input.id,
      name: input.name,
      colorClassificationId: input.colorId
    });
    return ok(undefined);
  });
}

export async function deleteMethod(
  session: SessionData,
  id: Id
): Promise<Result<void, TypeMethodError>> {
  return withDemoWriteVoid(session, async () => {
    const target = await methodRepo.findMethodInScope(session, id);
    if (!target) {
      return err('notInScope');
    }
    try {
      await methodRepo.deleteMethodById(id);
      return ok(undefined);
    } catch (error) {
      return err(toDeleteError(error));
    }
  });
}

// 任意順の並べ替え。ids の並びが新しい順。全 id が scope 内かつ同じ集まり
// （収支の区分と所有）に揃っていることを検証してから、既存の sort 値を割り当て直す。
export async function reorderTypes(
  session: SessionData,
  ids: Id[]
): Promise<Result<void, TypeMethodError>> {
  return withDemoWriteVoid(session, async () => {
    const rows = await typeRepo.findTypeRowsForReorder(session, ids);
    const plan = planReorder(rows, ids, (row) => `${row.isPay}:${row.pairId}`);
    if (plan === null) {
      return err('notInScope');
    }
    await typeRepo.updateTypeSorts(plan);
    return ok(undefined);
  });
}

export async function reorderSubTypes(
  session: SessionData,
  typeId: Id,
  ids: Id[]
): Promise<Result<void, TypeMethodError>> {
  return withDemoWriteVoid(session, async () => {
    const rows = await typeRepo.findSubTypeRowsForReorder(session, typeId, ids);
    const plan = planReorder(rows, ids, (row) => String(row.typeId));
    if (plan === null) {
      return err('notInScope');
    }
    await typeRepo.updateSubTypeSorts(plan);
    return ok(undefined);
  });
}

export async function reorderMethods(
  session: SessionData,
  ids: Id[]
): Promise<Result<void, TypeMethodError>> {
  return withDemoWriteVoid(session, async () => {
    const rows = await methodRepo.findMethodRowsForReorder(session, ids);
    const plan = planReorder(rows, ids, (row) => `${row.isPay}:${row.pairId}`);
    if (plan === null) {
      return err('notInScope');
    }
    await methodRepo.updateMethodSorts(plan);
    return ok(undefined);
  });
}
