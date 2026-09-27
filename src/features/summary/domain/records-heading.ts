// 明細の見出しとタグの文言。純粋関数（絞り込み条件から組み立てる）。

export type RecordsTarget = {
  // true = カテゴリ（+ 任意のサブカテゴリ）で絞る、false = 方法で絞る。
  isType: boolean;
  isPay: boolean;
  isPair: boolean;
  isIncludeInstead: boolean;
  // カテゴリ名 or 方法名。
  name: string;
  // カテゴリ軸でサブカテゴリまで絞っているときだけ。
  subTypeName: string | null;
};

// 見出し。サブカテゴリまで絞っていれば「食費 › スーパー」。
export function recordsTitle(target: RecordsTarget): string {
  if (target.subTypeName === null) {
    return target.name;
  }
  return `${target.name} › ${target.subTypeName}`;
}

// 1 枚目のタグ。軸と支出収入の 4 通り。
export function axisTag(
  target: Pick<RecordsTarget, 'isType' | 'isPay'>
): string {
  if (target.isType) {
    return target.isPay ? '支出カテゴリ' : '収入カテゴリ';
  }
  return target.isPay ? '支払方法' : '受取方法';
}

// 2 枚目のタグ。どのスコープの数字を見ているか。
// 共有は立替を区別しないので 1 語、個人は立替の扱いを添える。
export function scopeTag(
  target: Pick<RecordsTarget, 'isPair' | 'isIncludeInstead'>
): string {
  if (target.isPair) {
    return '共有';
  }
  return target.isIncludeInstead ? '個人 · 立替込み' : '個人 · 自分のみ';
}
