// bank feature の表示整形ヘルパ（純粋関数・FE/BE 両用）。
// 金額の「入力パース」は lib/shared/domain/price が担う。こちらは bank 固有の
// 「表示単位（万・小数第一位）」への整形で責務が別（price.ts には混ぜない）。

// 円を万単位・小数第一位に丸める。
export function toManUnit(value: number): number {
  return Math.round(value / 1000) / 10;
}

// 残高チャートの X 軸ラベル。点は YYYY-MM-DD だが、軸に日まで並べると
// スマホ幅ではラベルが 1 本しか入らない。軸は年月に畳み、日はツールチップで見せる。
export function toAxisMonthLabel(dateStr: string): string {
  const [year, month] = dateStr.split('-');
  if (!(year && month)) {
    return dateStr;
  }
  return `${year}/${month}`;
}

// ツールチップの見出し。軸が年月までなので、日はここで補う。
export function toTooltipDateLabel(dateStr: string): string {
  return dateStr.replaceAll('-', '/');
}
