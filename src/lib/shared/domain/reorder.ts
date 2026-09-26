import { z } from 'zod';
import type { Id } from '@/lib/shared/types/id';
import { entityIdSchema } from './entityId';

// 並べ替え（ドラッグで任意順にする）の共通ロジック。
//
// sort 列は「その集まりの中で昇順に並ぶ」ことだけが意味で、値そのものに意味は無い。
// そのため新しい順に並べ替えるときは、既存の sort 値を昇順に取り、新しい順の行へ
// 先頭から割り当て直す。値の集合は変わらず、行同士の順だけが入れ替わる
// （新しい値を発番しないので、同じ集まりの外の行と衝突しない）。

// 並べ替えの Server Action が受ける入力。id の並びそのものが新しい順。
export const reorderIdsSchema = z.object({
  ids: z.array(entityIdSchema()).min(1)
});

export type SortAssignment = { id: Id; sort: number };

// 既存の sort 値を昇順に並べ、orderedIds の順に割り当て直す。
// 長さが合わないときは呼び出し側の検証漏れなので例外にする。
export function assignSorts(
  existingSorts: number[],
  orderedIds: Id[]
): SortAssignment[] {
  if (existingSorts.length !== orderedIds.length) {
    throw new Error('sort の数と id の数が合いません');
  }
  const sorts = [...existingSorts].sort((a, b) => a - b);
  return orderedIds.map((id, index) => ({ id, sort: sorts[index] }));
}

// 並べ替え対象の行が「同じ集まり」に揃っているかを検証してから割り当てを作る。
//
// rows は scope 内で id が一致した行（検証はここでする）。orderedIds に重複や
// scope 外の id があるとき、集まり（bucketOf が返す鍵。isPay と pairId の組など）が
// 混ざっているときは null。別の集まりの行が混ざると、その集まりの並びを壊すため。
export function planReorder<Row extends { id: Id; sort: number }>(
  rows: Row[],
  orderedIds: Id[],
  bucketOf: (row: Row) => string
): SortAssignment[] | null {
  const uniqueIds = new Set(orderedIds);
  if (
    uniqueIds.size !== orderedIds.length ||
    rows.length !== orderedIds.length
  ) {
    return null;
  }
  const rowById = new Map(rows.map((row) => [row.id, row]));
  if (orderedIds.some((id) => !rowById.has(id))) {
    return null;
  }
  const buckets = new Set(rows.map(bucketOf));
  if (buckets.size !== 1) {
    return null;
  }
  return assignSorts(
    rows.map((row) => row.sort),
    orderedIds
  );
}
