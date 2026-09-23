import 'server-only';
import type { MemoItem, ShortCutItem } from '@/features/memo-shortcut/types';
import type { SessionScope } from '@/lib/shared/types/auth';
import { colorName } from '../dataset/colors';
import { memoRows } from '../dataset/memos';
import { findMethod } from '../dataset/methods';
import { isVisibleTo, ownedBy, visibleTo } from '../dataset/scope';
import { shortCutRows } from '../dataset/short-cuts';
import { findSubType, findType } from '../dataset/types';

// memo-shortcut のデモ射影。

export function getMemoList(scope: SessionScope): MemoItem[] {
  return visibleTo(scope, memoRows).map((row) => ({
    id: row.id,
    memo: row.memo,
    isPair: row.pairId !== null
  }));
}

// 個人専用テーブル（buildOwnerScopeWhere 相当）。ただし参照先のカテゴリが見えない
// ショートカット（solo デモにおけるペア共有カテゴリ）は、参照整合のため出さない。
export function getShortCutList(scope: SessionScope): ShortCutItem[] {
  return ownedBy(scope, shortCutRows)
    .filter((row) => isVisibleTo(scope, findType(row.typeId)))
    .map((row) => {
      const method = findMethod(row.methodId);
      const type = findType(row.typeId);
      return {
        id: row.id,
        isPay: row.isPay,
        price: row.price,
        memo: row.memo,
        recordType: row.recordType,
        methodId: row.methodId,
        methodName: method.name,
        typeId: row.typeId,
        typeName: type.name,
        colorName: colorName(type.colorId),
        subTypeId: row.subTypeId,
        subTypeName:
          row.subTypeId === null ? null : findSubType(row.subTypeId).name
      };
    });
}
