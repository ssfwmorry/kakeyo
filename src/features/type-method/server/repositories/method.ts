import 'server-only';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/server/db/client';
import { methods } from '@/lib/server/db/schema';
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
// 色名は結合せず colorClassificationId を、isPair も pairId を渡して呼び出し側に委ねる。
// self/pair のグルーピングは service 層が行うため、ここは sort 昇順のみ。
//
// 組み立てられる SQL:
//
//   select * from methods
//   where methods.user_id = :userUid or methods.pair_id = :pairId
//   order by methods.sort;
export async function findMethodRows(
  scope: SessionScope
): Promise<MethodRow[]> {
  const rows = await db
    .select()
    .from(methods)
    .where(buildScopeWhere(methods, scope))
    .orderBy(asc(methods.sort));
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
  const [row] = await db
    .select({ id: methods.id, sort: methods.sort })
    .from(methods)
    .where(and(eq(methods.id, id), buildScopeWhere(methods, scope)))
    .limit(1);
  return row ?? null;
}

// CREATE / UPDATE
export async function insertMethod(input: {
  name: string;
  isPay: boolean | null;
  colorClassificationId: Id;
  userId: string | null;
  pairId: Id | null;
}): Promise<void> {
  await db.insert(methods).values({
    name: input.name,
    isPay: input.isPay,
    colorClassificationId: input.colorClassificationId,
    userId: input.userId,
    pairId: input.pairId
  });
}

export async function updateMethod(input: {
  id: Id;
  name: string;
  colorClassificationId: Id;
}): Promise<void> {
  await db
    .update(methods)
    .set({
      name: input.name,
      colorClassificationId: input.colorClassificationId
    })
    .where(eq(methods.id, input.id));
}

export async function deleteMethodById(id: Id): Promise<void> {
  await db.delete(methods).where(eq(methods.id, id));
}

// REORDER（任意順）。集まり（isPay・pairId）の検証は service 層で行う。
export async function findMethodRowsForReorder(
  scope: SessionScope,
  ids: Id[]
): Promise<
  { id: Id; sort: number; isPay: boolean | null; pairId: Id | null }[]
> {
  return db
    .select({
      id: methods.id,
      sort: methods.sort,
      isPay: methods.isPay,
      pairId: methods.pairId
    })
    .from(methods)
    .where(and(inArray(methods.id, ids), buildScopeWhere(methods, scope)));
}

export async function updateMethodSorts(
  assignments: SortAssignment[]
): Promise<void> {
  await db.transaction(async (tx) => {
    for (const { id, sort } of assignments) {
      await tx.update(methods).set({ sort }).where(eq(methods.id, id));
    }
  });
}
