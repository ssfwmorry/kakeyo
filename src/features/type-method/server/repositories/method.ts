import 'server-only';
import { prisma } from '@/lib/server/db/client';
import { buildScopeWhere } from '@/lib/shared/db/scope';
import type { SortAssignment } from '@/lib/shared/domain/reorder';
import type { SessionScope } from '@/lib/shared/types/auth';
import type { Id } from '@/lib/shared/types/id';

// method レーンの「被参照 I/F」。
// record / summary が参照するため型・シグネチャは固定。
// 取得系は必ず buildScopeWhere を通す（scope 漏れ = 情報漏洩）。

// is_pay は送金方法（精算 = both）の場合 null。
export type MethodSummary = {
  id: Id;
  name: string;
  isPay: boolean | null;
  colorClassificationId: Id;
};

// 画面用リッチ取得（services 層）が使う行データ。sort・is_pair 判定用の pairId を含む。
export type MethodRow = {
  id: Id;
  name: string;
  isPay: boolean | null;
  sort: number;
  colorClassificationId: Id;
  pairId: Id | null;
};

// READ（被参照 I/F）。他レーン用の薄い配列。
export async function getMethodList(
  scope: SessionScope
): Promise<MethodSummary[]> {
  const rows = await findMethodRows(scope);
  return rows.map((method) => ({
    id: method.id,
    name: method.name,
    isPay: method.isPay,
    colorClassificationId: method.colorClassificationId
  }));
}

// READ（画面用）。色分け・並べ替え・is_pair 判定に必要な列を含めて返す。
export async function findMethodRows(
  scope: SessionScope
): Promise<MethodRow[]> {
  const rows = await prisma.method.findMany({
    where: buildScopeWhere(scope),
    orderBy: { sort: 'asc' }
  });
  return rows.map((method) => ({
    id: method.id,
    name: method.name,
    isPay: method.isPay,
    sort: method.sort,
    colorClassificationId: method.colorClassificationId,
    pairId: method.pairId
  }));
}

// scope 検証: 指定 method が scope 内か。delete の対象確認に使う。
export async function findMethodInScope(
  scope: SessionScope,
  id: Id
): Promise<{ id: Id; sort: number } | null> {
  return prisma.method.findFirst({
    where: { AND: [{ id }, buildScopeWhere(scope)] },
    select: { id: true, sort: true }
  });
}

// CREATE / UPDATE
export async function insertMethod(input: {
  name: string;
  isPay: boolean | null;
  colorClassificationId: Id;
  userId: string | null;
  pairId: Id | null;
}): Promise<void> {
  await prisma.method.create({
    data: {
      name: input.name,
      isPay: input.isPay,
      colorClassificationId: input.colorClassificationId,
      userId: input.userId,
      pairId: input.pairId
    }
  });
}

export async function updateMethod(input: {
  id: Id;
  name: string;
  colorClassificationId: Id;
}): Promise<void> {
  await prisma.method.update({
    where: { id: input.id },
    data: {
      name: input.name,
      colorClassificationId: input.colorClassificationId
    }
  });
}

export async function deleteMethodById(id: Id): Promise<void> {
  await prisma.method.delete({ where: { id } });
}

// REORDER（任意順）。集まり（isPay・pairId）の検証は service 層で行う。
export async function findMethodRowsForReorder(
  scope: SessionScope,
  ids: Id[]
): Promise<
  { id: Id; sort: number; isPay: boolean | null; pairId: Id | null }[]
> {
  return prisma.method.findMany({
    where: { AND: [{ id: { in: ids } }, buildScopeWhere(scope)] },
    select: { id: true, sort: true, isPay: true, pairId: true }
  });
}

export async function updateMethodSorts(
  assignments: SortAssignment[]
): Promise<void> {
  await prisma.$transaction(
    assignments.map(({ id, sort }) =>
      prisma.method.update({ where: { id }, data: { sort } })
    )
  );
}
