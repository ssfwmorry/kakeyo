import 'server-only';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/server/db/client';
import { subTypes, types } from '@/lib/server/db/schema';
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
// 色名の結合と isPair の算出は行わず、colorClassificationId / pairId を渡して
// 呼び出し側に委ねる。
//
// 組み立てられる SQL（type × sub_type の横長行を TS 側で type ごとに畳み込む）:
//
//   select types.id, types.name, types.is_pay, types.sort,
//          types.color_classification_id, types.pair_id,
//          sub_types.id, sub_types.name, sub_types.sort
//   from types
//   left join sub_types on sub_types.type_id = types.id
//   where types.user_id = :userUid or types.pair_id = :pairId
//   order by types.sort, sub_types.sort;
export async function findTypeRows(scope: SessionScope): Promise<TypeRow[]> {
  const rows = await db
    .select({
      id: types.id,
      name: types.name,
      isPay: types.isPay,
      sort: types.sort,
      colorClassificationId: types.colorClassificationId,
      pairId: types.pairId,
      subType: {
        id: subTypes.id,
        name: subTypes.name,
        sort: subTypes.sort
      }
    })
    .from(types)
    .leftJoin(subTypes, eq(subTypes.typeId, types.id))
    .where(buildScopeWhere(types, scope))
    .orderBy(asc(types.sort), asc(subTypes.sort));

  const byId = new Map<Id, TypeRow>();
  for (const row of rows) {
    let type = byId.get(row.id);
    if (!type) {
      type = {
        id: row.id,
        name: row.name,
        isPay: row.isPay,
        sort: row.sort,
        colorClassificationId: row.colorClassificationId,
        pairId: row.pairId,
        subTypes: []
      };
      byId.set(row.id, type);
    }
    if (row.subType !== null) {
      type.subTypes.push(row.subType);
    }
  }
  return [...byId.values()];
}

// scope 検証: 指定 type が scope 内か。delete の対象確認に使う。
export async function findTypeInScope(
  scope: SessionScope,
  id: Id
): Promise<{ id: Id; sort: number } | null> {
  const [row] = await db
    .select({ id: types.id, sort: types.sort })
    .from(types)
    .where(and(eq(types.id, id), buildScopeWhere(types, scope)))
    .limit(1);
  return row ?? null;
}

// scope 検証: 指定 sub_type の親 type が scope 内か。
export async function findSubTypeInScope(
  scope: SessionScope,
  id: Id
): Promise<{ id: Id; sort: number } | null> {
  const [sub] = await db
    .select({ id: subTypes.id, sort: subTypes.sort })
    .from(subTypes)
    .innerJoin(types, eq(subTypes.typeId, types.id))
    .where(and(eq(subTypes.id, id), buildScopeWhere(types, scope)))
    .limit(1);
  return sub ?? null;
}

// CREATE / UPDATE
export async function insertType(input: {
  name: string;
  isPay: boolean;
  colorClassificationId: Id;
  userId: string | null;
  pairId: Id | null;
}): Promise<void> {
  await db.insert(types).values({
    name: input.name,
    isPay: input.isPay,
    colorClassificationId: input.colorClassificationId,
    userId: input.userId,
    pairId: input.pairId
  });
}

export async function updateType(input: {
  id: Id;
  name: string;
  colorClassificationId: Id;
}): Promise<void> {
  await db
    .update(types)
    .set({
      name: input.name,
      colorClassificationId: input.colorClassificationId
    })
    .where(eq(types.id, input.id));
}

export async function deleteTypeById(id: Id): Promise<void> {
  await db.delete(types).where(eq(types.id, id));
}

// SUB TYPE CREATE / UPDATE / DELETE
export async function insertSubType(input: {
  typeId: Id;
  name: string;
}): Promise<void> {
  await db.insert(subTypes).values({ typeId: input.typeId, name: input.name });
}

export async function updateSubType(input: {
  id: Id;
  name: string;
}): Promise<void> {
  await db
    .update(subTypes)
    .set({ name: input.name })
    .where(eq(subTypes.id, input.id));
}

export async function deleteSubTypeById(id: Id): Promise<void> {
  await db.delete(subTypes).where(eq(subTypes.id, id));
}

// REORDER（任意順）。並べ替え対象の行を scope 内から引く。集まり（isPay・pairId）の
// 検証は service 層で行う。
export async function findTypeRowsForReorder(
  scope: SessionScope,
  ids: Id[]
): Promise<{ id: Id; sort: number; isPay: boolean; pairId: Id | null }[]> {
  return db
    .select({
      id: types.id,
      sort: types.sort,
      isPay: types.isPay,
      pairId: types.pairId
    })
    .from(types)
    .where(and(inArray(types.id, ids), buildScopeWhere(types, scope)));
}

export async function findSubTypeRowsForReorder(
  scope: SessionScope,
  typeId: Id,
  ids: Id[]
): Promise<{ id: Id; sort: number; typeId: Id }[]> {
  return db
    .select({ id: subTypes.id, sort: subTypes.sort, typeId: subTypes.typeId })
    .from(subTypes)
    .innerJoin(types, eq(subTypes.typeId, types.id))
    .where(
      and(
        inArray(subTypes.id, ids),
        eq(subTypes.typeId, typeId),
        buildScopeWhere(types, scope)
      )
    );
}

// 割り当て済みの sort を 1 トランザクションで書く。
export async function updateTypeSorts(
  assignments: SortAssignment[]
): Promise<void> {
  await db.transaction(async (tx) => {
    for (const { id, sort } of assignments) {
      await tx.update(types).set({ sort }).where(eq(types.id, id));
    }
  });
}

export async function updateSubTypeSorts(
  assignments: SortAssignment[]
): Promise<void> {
  await db.transaction(async (tx) => {
    for (const { id, sort } of assignments) {
      await tx.update(subTypes).set({ sort }).where(eq(subTypes.id, id));
    }
  });
}
