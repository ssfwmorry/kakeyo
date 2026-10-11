import 'server-only';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '@/lib/server/db/client';
import {
  colorClassifications,
  dayClassifications,
  methods,
  plannedRecords,
  records,
  subTypes,
  types,
  users
} from '@/lib/server/db/schema';
import { buildScopeWhere } from '@/lib/shared/db/scope';
import type { SortAssignment } from '@/lib/shared/domain/reorder';
import type { SessionScope } from '@/lib/shared/types/auth';
import type { Id } from '@/lib/shared/types/id';
import type { RecordType } from '@/lib/shared/types/recordType';
import type {
  NotePlannedRecordDefault,
  PlannedRecordListItem
} from '../../types';

// planned_records.id は serial Int（BigInt でない）ため id 変換は不要。

// planned_records への書き込みフィールド（user_id/pair_id/record_type は
// service 層が resolvePlannedRecordOwnership で導出済み）。id 有無で insert/update を分ける。
export type PlannedRecordUpsertFields = {
  userId: string | null;
  pairId: Id | null;
  dayClassificationId: Id;
  isPay: boolean;
  methodId: Id;
  typeId: Id;
  subTypeId: Id | null;
  price: number;
  memo: string | null;
  recordType: RecordType;
};

// マッパーが読む列だけ select で絞る
// （day 名、method/type の名前＋色名、subType 名、立替者の user 名）。
// method と type はそれぞれ別の色行を引くため color_classifications を別名で 2 回 join する。
const methodColor = alias(colorClassifications, 'method_color');
const typeColor = alias(colorClassifications, 'type_color');

const plannedRecordColumns = {
  id: plannedRecords.id,
  userId: plannedRecords.userId,
  pairId: plannedRecords.pairId,
  isPay: plannedRecords.isPay,
  price: plannedRecords.price,
  memo: plannedRecords.memo,
  sort: plannedRecords.sort,
  dayClassificationId: plannedRecords.dayClassificationId,
  dayClassificationName: dayClassifications.name,
  methodId: plannedRecords.methodId,
  methodName: methods.name,
  methodColorName: methodColor.name,
  typeId: plannedRecords.typeId,
  typeName: types.name,
  typeColorName: typeColor.name,
  subTypeId: plannedRecords.subTypeId,
  subTypeName: subTypes.name,
  userName: users.name
} as const;

type PlannedRecordSelectedRow = {
  id: Id;
  userId: string | null;
  pairId: Id | null;
  isPay: boolean;
  price: number;
  memo: string | null;
  sort: number;
  dayClassificationId: Id;
  dayClassificationName: string;
  methodId: Id;
  methodName: string;
  methodColorName: string;
  typeId: Id;
  typeName: string;
  typeColorName: string;
  subTypeId: Id | null;
  subTypeName: string | null;
  userName: string | null;
};

// READ: 定期一覧（設定タブ用）。self/pair の分けは service 側のグルーピングで行う。
// isSelf / isPair / pairUserName は user_id・pair_id から TS 側
// （toPlannedRecordListItem）で導出する。
//
// 組み立てられる SQL:
//
//   select planned_records.id, planned_records.user_id, planned_records.pair_id,
//          planned_records.is_pay, planned_records.price, planned_records.memo,
//          planned_records.sort,
//          day_classifications.id, day_classifications.name,
//          methods.id, methods.name, method_color.name,
//          types.id, types.name, type_color.name,
//          sub_types.id, sub_types.name,
//          users.name
//   from planned_records
//   inner join day_classifications on
//       planned_records.day_classification_id = day_classifications.id
//   inner join methods on planned_records.method_id = methods.id
//   inner join color_classifications as method_color on
//       methods.color_classification_id = method_color.id
//   inner join types on planned_records.type_id = types.id
//   inner join color_classifications as type_color on
//       types.color_classification_id = type_color.id
//   left join sub_types on planned_records.sub_type_id = sub_types.id
//   left join users on planned_records.user_id = users.uid
//   where planned_records.user_id = :userUid
//       or planned_records.pair_id = :pairId
//   order by planned_records.sort;
export async function findPlannedRecordRows(
  scope: SessionScope
): Promise<PlannedRecordListItem[]> {
  const rows = await db
    .select(plannedRecordColumns)
    .from(plannedRecords)
    .innerJoin(
      dayClassifications,
      eq(plannedRecords.dayClassificationId, dayClassifications.id)
    )
    .innerJoin(methods, eq(plannedRecords.methodId, methods.id))
    .innerJoin(methodColor, eq(methods.colorClassificationId, methodColor.id))
    .innerJoin(types, eq(plannedRecords.typeId, types.id))
    .innerJoin(typeColor, eq(types.colorClassificationId, typeColor.id))
    .leftJoin(subTypes, eq(plannedRecords.subTypeId, subTypes.id))
    .leftJoin(users, eq(plannedRecords.userId, users.uid))
    .where(buildScopeWhere(plannedRecords, scope))
    .orderBy(asc(plannedRecords.sort));
  return rows.map((row) => toPlannedRecordListItem(row, scope.userUid));
}

function toPlannedRecordListItem(
  row: PlannedRecordSelectedRow,
  userUid: string
): PlannedRecordListItem {
  const isPair = row.pairId !== null;
  return {
    id: row.id,
    isSelf: row.userId === userUid,
    isPay: row.isPay,
    price: row.price,
    memo: row.memo,
    sort: row.sort,
    isPair,
    // pair_id ありのときのみ立替者名を引く。
    pairUserName: isPair ? row.userName : null,
    dayClassificationId: row.dayClassificationId,
    dayClassificationName: row.dayClassificationName,
    methodId: row.methodId,
    methodName: row.methodName,
    methodColorClassificationName: row.methodColorName,
    typeId: row.typeId,
    typeName: row.typeName,
    typeColorClassificationName: row.typeColorName,
    subTypeId: row.subTypeId,
    subTypeName: row.subTypeName
  };
}

// READ: 定期編集の初期値 1 件。scope 内でなければ null。
// isInstead は「共有かつ user_id あり（=立替者が特定されている）」で導出する。
export async function findPlannedRecordForEdit(
  scope: SessionScope,
  id: Id
): Promise<NotePlannedRecordDefault | null> {
  const [row] = await db
    .select()
    .from(plannedRecords)
    .where(
      and(eq(plannedRecords.id, id), buildScopeWhere(plannedRecords, scope))
    )
    .limit(1);
  if (!row) {
    return null;
  }
  const isPair = row.pairId !== null;
  return {
    id: row.id,
    isPay: row.isPay,
    dayClassificationId: row.dayClassificationId,
    methodId: row.methodId,
    typeId: row.typeId,
    subTypeId: row.subTypeId,
    memo: row.memo,
    price: row.price,
    isInstead: isPair && row.userId !== null,
    isPair
  };
}

// scope 検証: 指定 planned_record が scope 内か。update の対象確認に使う
// （他ペアの行を触らせない）。
export async function findPlannedRecordInScope(
  scope: SessionScope,
  id: Id
): Promise<{ id: Id; sort: number } | null> {
  const [row] = await db
    .select({ id: plannedRecords.id, sort: plannedRecords.sort })
    .from(plannedRecords)
    .where(
      and(eq(plannedRecords.id, id), buildScopeWhere(plannedRecords, scope))
    )
    .limit(1);
  return row ?? null;
}

// CREATE。所有列（user_id/pair_id/record_type）は service が導出済み。
export async function insertPlannedRecord(
  input: PlannedRecordUpsertFields
): Promise<void> {
  await db.insert(plannedRecords).values({
    userId: input.userId,
    pairId: input.pairId,
    dayClassificationId: input.dayClassificationId,
    isPay: input.isPay,
    methodId: input.methodId,
    typeId: input.typeId,
    subTypeId: input.subTypeId,
    price: input.price,
    memo: input.memo,
    recordType: input.recordType
  });
}

// UPDATE。対象が scope 内であることは service 層で検証済み前提。
// 共有↔個人・立替切替で user_id / pair_id を NULL 化しうるため明示的に全列を上書きする。
export async function updatePlannedRecord(
  id: Id,
  input: PlannedRecordUpsertFields
): Promise<void> {
  await db
    .update(plannedRecords)
    .set({
      userId: input.userId,
      pairId: input.pairId,
      dayClassificationId: input.dayClassificationId,
      isPay: input.isPay,
      methodId: input.methodId,
      typeId: input.typeId,
      subTypeId: input.subTypeId,
      price: input.price,
      memo: input.memo,
      recordType: input.recordType
    })
    .where(eq(plannedRecords.id, id));
}

// DELETE（1 件）。scope を where に AND し、削除できたかを返す
// （scope 外の行は 0 件で notFound）。
//
// 実体化済み record は残す（「これまでに記録された分は残ります」）。records の
// planned_record_id を先に NULL にしてから消すので、FK 制約に当たらない。
// 2 つの更新は同じトランザクションで行い、NULL 化だけ済んで削除に失敗する状態を作らない。
// records 側の scope は定期と同じ所有（個人なら user_id、共有なら pair_id）なので
// buildScopeWhere でそのまま絞れる。
export async function deletePlannedRecordById(
  scope: SessionScope,
  id: Id
): Promise<{ ok: true } | { ok: false; error: 'notFound' }> {
  return db.transaction(async (tx) => {
    const [target] = await tx
      .select({ id: plannedRecords.id })
      .from(plannedRecords)
      .where(
        and(eq(plannedRecords.id, id), buildScopeWhere(plannedRecords, scope))
      )
      .limit(1);
    if (target === undefined) {
      return { ok: false, error: 'notFound' };
    }
    await tx
      .update(records)
      .set({ plannedRecordId: null })
      .where(
        and(eq(records.plannedRecordId, id), buildScopeWhere(records, scope))
      );
    await tx.delete(plannedRecords).where(eq(plannedRecords.id, id));
    return { ok: true };
  });
}

// REORDER（任意順）。集まり（pairId）の検証は service 層で行う。
export async function findPlannedRecordRowsForReorder(
  scope: SessionScope,
  ids: Id[]
): Promise<{ id: Id; sort: number; pairId: Id | null }[]> {
  return db
    .select({
      id: plannedRecords.id,
      sort: plannedRecords.sort,
      pairId: plannedRecords.pairId
    })
    .from(plannedRecords)
    .where(
      and(
        inArray(plannedRecords.id, ids),
        buildScopeWhere(plannedRecords, scope)
      )
    );
}

export async function updatePlannedRecordSorts(
  assignments: SortAssignment[]
): Promise<void> {
  await db.transaction(async (tx) => {
    for (const { id, sort } of assignments) {
      await tx
        .update(plannedRecords)
        .set({ sort })
        .where(eq(plannedRecords.id, id));
    }
  });
}
