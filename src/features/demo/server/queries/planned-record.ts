import 'server-only';
import type {
  GroupedPlannedRecordList,
  NotePlannedRecordDefault,
  PlannedRecordListItem
} from '@/features/planned-record/types';
import type { SessionScope } from '@/lib/shared/types/auth';
import { colorName } from '../dataset/colors';
import { findDay } from '../dataset/day-classifications';
import { findMethod } from '../dataset/methods';
import {
  type DemoPlannedRecord,
  plannedRecordRows
} from '../dataset/planned-records';
import { visibleTo } from '../dataset/scope';
import { findSubType, findType } from '../dataset/types';
import { findDemoUserName } from '../dataset/users';

// planned-record のデモ射影。join の列と isInstead の導出は実リポジトリ
// （toPlannedRecordListItem / findPlannedRecordForEdit）と同じ規則。

function toListItem(
  row: DemoPlannedRecord,
  scope: SessionScope
): PlannedRecordListItem {
  const method = findMethod(row.methodId);
  const type = findType(row.typeId);
  const isPair = row.pairId !== null;
  return {
    id: row.id,
    isSelf: row.userUid === scope.userUid,
    isPay: row.isPay,
    price: row.price,
    memo: row.memo,
    sort: row.sort,
    isPair,
    pairUserName: isPair ? findDemoUserName(row.userUid) : null,
    dayClassificationId: row.dayClassificationId,
    dayClassificationName: findDay(row.dayClassificationId).name,
    methodId: row.methodId,
    methodName: method.name,
    methodColorClassificationName: colorName(method.colorId),
    typeId: row.typeId,
    typeName: type.name,
    typeColorClassificationName: colorName(type.colorId),
    subTypeId: row.subTypeId,
    subTypeName: row.subTypeId === null ? null : findSubType(row.subTypeId).name
  };
}

// 設定「定期」タブ用: 定期一覧を self/pair に振り分けて返す。
export function getPlannedRecordList(
  scope: SessionScope
): GroupedPlannedRecordList {
  const items = visibleTo(scope, plannedRecordRows)
    .sort((a, b) => a.sort - b.sort)
    .map((row) => toListItem(row, scope));
  return {
    self: items.filter((item) => !item.isPair),
    pair: items.filter((item) => item.isPair)
  };
}

// findPlannedRecordForEdit 相当: scope 内の定期 1 件の初期値（見つからなければ null = 新規扱い）。
export function getPlannedRecordForEdit(
  scope: SessionScope,
  id: number
): NotePlannedRecordDefault | null {
  const row = visibleTo(scope, plannedRecordRows).find((r) => r.id === id);
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
    // 共有かつ起票者あり（= 立替者が特定されている）のとき isInstead。
    isInstead: isPair && row.userUid !== null,
    isPair
  };
}
