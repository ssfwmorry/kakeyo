import type {
  NotePlannedRecordDefault,
  PlannedRecordListItem
} from '@/features/planned-record';

// 一覧の 1 行の見せ方と、行から編集の初期値を起こす純関数。

// 共有の定期で立替者が特定されているとき（user_id あり）が立替。
export function isInsteadItem(item: PlannedRecordListItem): boolean {
  return item.isPair && item.pairUserName !== null;
}

// パートナーが立て替える定期は、パートナーだけが編集できる。
export function isLockedItem(item: PlannedRecordListItem): boolean {
  return isInsteadItem(item) && !item.isSelf;
}

// 「住居 › 家賃」。サブカテゴリが無ければカテゴリだけ。
export function itemTitle(item: PlannedRecordListItem): string {
  return item.subTypeName === null
    ? item.typeName
    : `${item.typeName} › ${item.subTypeName}`;
}

// 2 行目の補足。「方法 · 立替か共有のお金か · メモ」を「 · 」で結ぶ。
// パートナーの立替は方法が相手のものなので出さず、「はなこさんの立替」にする。
export function itemDescription(item: PlannedRecordListItem): string {
  if (isLockedItem(item)) {
    return [`${item.pairUserName}さんの立替`, item.memo]
      .filter((part) => part !== null && part !== '')
      .join(' · ');
  }
  const money = !(item.isPair && item.isPay)
    ? null
    : isInsteadItem(item)
      ? '自分が立替'
      : '共有のお金';
  return [item.methodName, money, item.memo]
    .filter((part) => part !== null && part !== '')
    .join(' · ');
}

// 一覧の行から編集シートの初期値を起こす（サーバへ取りに行かない）。
export function toPlannedRecordDefault(
  item: PlannedRecordListItem
): NotePlannedRecordDefault {
  return {
    id: item.id,
    isPay: item.isPay,
    dayClassificationId: item.dayClassificationId,
    methodId: item.methodId,
    typeId: item.typeId,
    subTypeId: item.subTypeId,
    memo: item.memo,
    price: item.price,
    isInstead: isInsteadItem(item),
    isPair: item.isPair
  };
}
