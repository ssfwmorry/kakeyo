// カテゴリ一覧の行に出すサブカテゴリの要約（原典 SetType）。
// 3 件までは全部並べ、4 件以上は先頭 2 件と残りの件数にする。
// 行の高さを一定に保ちつつ、何が入っているかの手がかりは残す。

const LISTED_MAX = 3;
const SHOWN_WHEN_MANY = 2;

export function summarizeSubTypes(names: string[]): string {
  if (names.length === 0) {
    return 'サブカテゴリなし';
  }
  if (names.length <= LISTED_MAX) {
    return names.join('、');
  }
  const rest = names.length - SHOWN_WHEN_MANY;
  return `${names.slice(0, SHOWN_WHEN_MANY).join('、')} ほか${rest}件`;
}
