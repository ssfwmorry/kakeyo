import 'server-only';
import { withDemoRead, withDemoWriteVoid } from '@/features/demo/server/inject';
import * as demoTypeMethod from '@/features/demo/server/queries/type-method';
import { getColorClassificationList } from '@/features/master/server/repositories/colorClassification';
import { isForeignKeyError } from '@/lib/server/db/errors';
import { resolveOwner } from '@/lib/server/pair/owner';
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

// 対象 2 行が両方 scope 内であることを検証してから入替（他ペアの並びを触らせない）。
async function loadSwapPair(
  find: (id: Id) => Promise<{ id: Id; sort: number } | null>,
  prevId: Id,
  nextId: Id
): Promise<
  Result<[{ id: Id; sort: number }, { id: Id; sort: number }], TypeMethodError>
> {
  const [a, b] = await Promise.all([find(prevId), find(nextId)]);
  if (!a || !b) {
    return err('notInScope');
  }
  return ok([a, b]);
}

export async function swapType(
  session: SessionData,
  prevId: Id,
  nextId: Id
): Promise<Result<void, TypeMethodError>> {
  return withDemoWriteVoid(session, async () => {
    const pair = await loadSwapPair(
      (id) => typeRepo.findTypeInScope(session, id),
      prevId,
      nextId
    );
    if (!pair.ok) {
      return pair;
    }
    await typeRepo.swapTypeSort(pair.data[0], pair.data[1]);
    return ok(undefined);
  });
}

export async function swapSubType(
  session: SessionData,
  prevId: Id,
  nextId: Id
): Promise<Result<void, TypeMethodError>> {
  return withDemoWriteVoid(session, async () => {
    const pair = await loadSwapPair(
      (id) => typeRepo.findSubTypeInScope(session, id),
      prevId,
      nextId
    );
    if (!pair.ok) {
      return pair;
    }
    await typeRepo.swapSubTypeSort(pair.data[0], pair.data[1]);
    return ok(undefined);
  });
}

export async function swapMethod(
  session: SessionData,
  prevId: Id,
  nextId: Id
): Promise<Result<void, TypeMethodError>> {
  return withDemoWriteVoid(session, async () => {
    const pair = await loadSwapPair(
      (id) => methodRepo.findMethodInScope(session, id),
      prevId,
      nextId
    );
    if (!pair.ok) {
      return pair;
    }
    await methodRepo.swapMethodSort(pair.data[0], pair.data[1]);
    return ok(undefined);
  });
}
