import type { PairedRecordItem } from '@/features/record';

// 精算画面の行に出すカテゴリ名（「食費 › スーパー」）。サブカテゴリが無ければカテゴリだけ。
export function categoryName(
  item: Pick<PairedRecordItem, 'typeName' | 'subTypeName'>
): string {
  return item.subTypeName === null
    ? item.typeName
    : `${item.typeName} › ${item.subTypeName}`;
}
