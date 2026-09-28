import 'server-only';
import { prisma } from '@/lib/server/db/client';
import { buildScopeWhere } from '@/lib/shared/db/scope';
import type { SortAssignment } from '@/lib/shared/domain/reorder';
import type { SessionScope } from '@/lib/shared/types/auth';
import type { Id } from '@/lib/shared/types/id';

// type/method レーンの「被参照 I/F」。
// record / summary が参照するため、シグネチャと戻り型は固定。
// 取得系は必ず buildScopeWhere を通す（scope 漏れ = 情報漏洩）。

// 整形済みカテゴリ（サブカテゴリ・色込み）。他レーンが参照する最小の形。
export type TypeWithSubTypes = {
  id: Id;
  name: string;
  isPay: boolean;
  colorClassificationId: Id;
  subTypes: SubTypeSummary[];
};

export type SubTypeSummary = {
  id: Id;
  name: string;
};

// 画面用リッチ取得（services 層）が使う行データ。被参照 I/F を太らせないよう
// ここで公開する。色名・sort・is_pair を含む生に近い行。
export type TypeRow = {
  id: Id;
  name: string;
  isPay: boolean;
  sort: number;
  colorClassificationId: Id;
  pairId: Id | null;
  subTypes: SubTypeRow[];
};

export type SubTypeRow = {
  id: Id;
  name: string;
  sort: number;
};

// READ（被参照 I/F）。他レーン用の薄い配列。sub_type は {id,name} のみに落とす。
export async function getTypeList(
  scope: SessionScope
): Promise<TypeWithSubTypes[]> {
  const rows = await findTypeRows(scope);
  return rows.map((type) => ({
    id: type.id,
    name: type.name,
    isPay: type.isPay,
    colorClassificationId: type.colorClassificationId,
    subTypes: type.subTypes.map((sub) => ({ id: sub.id, name: sub.name }))
  }));
}

// READ（画面用）。色分け・並べ替え・is_pair 判定に必要な列を含めて返す。
export async function findTypeRows(scope: SessionScope): Promise<TypeRow[]> {
  const rows = await prisma.type.findMany({
    where: buildScopeWhere(scope),
    include: { subTypes: { orderBy: { sort: 'asc' } } },
    orderBy: { sort: 'asc' }
  });
  return rows.map((type) => ({
    id: type.id,
    name: type.name,
    isPay: type.isPay,
    sort: type.sort,
    colorClassificationId: type.colorClassificationId,
    pairId: type.pairId,
    subTypes: type.subTypes.map((sub) => ({
      id: sub.id,
      name: sub.name,
      sort: sub.sort
    }))
  }));
}

// scope 検証: 指定 type が scope 内か。delete の対象確認に使う。
export async function findTypeInScope(
  scope: SessionScope,
  id: Id
): Promise<{ id: Id; sort: number } | null> {
  return prisma.type.findFirst({
    where: { AND: [{ id }, buildScopeWhere(scope)] },
    select: { id: true, sort: true }
  });
}

// scope 検証: 指定 sub_type の親 type が scope 内か。
export async function findSubTypeInScope(
  scope: SessionScope,
  id: Id
): Promise<{ id: Id; sort: number } | null> {
  const sub = await prisma.subType.findFirst({
    where: { id, type: buildScopeWhere(scope) },
    select: { id: true, sort: true }
  });
  return sub;
}

// CREATE / UPDATE
export async function insertType(input: {
  name: string;
  isPay: boolean;
  colorClassificationId: Id;
  userId: string | null;
  pairId: Id | null;
}): Promise<void> {
  await prisma.type.create({
    data: {
      name: input.name,
      isPay: input.isPay,
      colorClassificationId: input.colorClassificationId,
      userId: input.userId,
      pairId: input.pairId
    }
  });
}

export async function updateType(input: {
  id: Id;
  name: string;
  colorClassificationId: Id;
}): Promise<void> {
  await prisma.type.update({
    where: { id: input.id },
    data: {
      name: input.name,
      colorClassificationId: input.colorClassificationId
    }
  });
}

export async function deleteTypeById(id: Id): Promise<void> {
  await prisma.type.delete({ where: { id } });
}

// SUB TYPE CREATE / UPDATE / DELETE
export async function insertSubType(input: {
  typeId: Id;
  name: string;
}): Promise<void> {
  await prisma.subType.create({
    data: { typeId: input.typeId, name: input.name }
  });
}

export async function updateSubType(input: {
  id: Id;
  name: string;
}): Promise<void> {
  await prisma.subType.update({
    where: { id: input.id },
    data: { name: input.name }
  });
}

export async function deleteSubTypeById(id: Id): Promise<void> {
  await prisma.subType.delete({ where: { id } });
}

// REORDER（任意順）。並べ替え対象の行を scope 内から引く。集まり（isPay・pairId）の
// 検証は service 層で行う。
export async function findTypeRowsForReorder(
  scope: SessionScope,
  ids: Id[]
): Promise<{ id: Id; sort: number; isPay: boolean; pairId: Id | null }[]> {
  return prisma.type.findMany({
    where: { AND: [{ id: { in: ids } }, buildScopeWhere(scope)] },
    select: { id: true, sort: true, isPay: true, pairId: true }
  });
}

export async function findSubTypeRowsForReorder(
  scope: SessionScope,
  typeId: Id,
  ids: Id[]
): Promise<{ id: Id; sort: number; typeId: Id }[]> {
  return prisma.subType.findMany({
    where: { id: { in: ids }, typeId, type: buildScopeWhere(scope) },
    select: { id: true, sort: true, typeId: true }
  });
}

// 割り当て済みの sort を 1 トランザクションで書く。
export async function updateTypeSorts(
  assignments: SortAssignment[]
): Promise<void> {
  await prisma.$transaction(
    assignments.map(({ id, sort }) =>
      prisma.type.update({ where: { id }, data: { sort } })
    )
  );
}

export async function updateSubTypeSorts(
  assignments: SortAssignment[]
): Promise<void> {
  await prisma.$transaction(
    assignments.map(({ id, sort }) =>
      prisma.subType.update({ where: { id }, data: { sort } })
    )
  );
}
