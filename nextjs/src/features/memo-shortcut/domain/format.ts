// memo-shortcut feature の表示整形ヘルパ（純粋関数・FE/BE 両用）。
// 金額の「入力パース」は lib/shared/domain/price が担う。こちらはショートカット
// カードの「金額表示（¥ + 3 桁区切り）」への整形で責務が別。

// ショートカットの支出/収入符号を付けた表示ラベルを作る。
// isPay=true は支出（-）、false は収入（+）。旧 Nuxt のショートカット表示に倣う。
export function formatShortcutAmount(price: number, isPay: boolean): string {
  const sign = isPay ? '-' : '+';
  return `${sign}¥${price.toLocaleString('ja-JP')}`;
}
