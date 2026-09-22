// memo-shortcut feature の表示整形ヘルパ（純粋関数・FE/BE 両用）。
// 金額の「入力パース」は lib/shared/domain/price が担う。こちらはショートカット
// カードの「金額表示（¥ + 3 桁区切り）」への整形で責務が別。

// isPay=true は支出（-）、false は収入（+）。
export function formatShortcutAmount(price: number, isPay: boolean): string {
  const sign = isPay ? '-' : '+';
  return `${sign}¥${price.toLocaleString('ja-JP')}`;
}
