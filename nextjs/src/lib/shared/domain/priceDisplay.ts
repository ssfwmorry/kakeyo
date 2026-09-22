// 収支金額の表示整形（純粋関数・FE/BE 両用・単一の正）。
// 「支出=正」向きに符号を見せる（収支がマイナス=支出超過を正で表す）。summary / calendar が共有する。
// 金額の「入力パース」は price.ts、bank の「万単位」整形は bank/domain/format.ts が
// 担う（責務が別）ので、ここには符号付き表示整形のみを置く。

// 正/0 はそのまま桁区切り、負は先頭 '+' を付けて絶対値表示。
export function formatSignedSum(value: number): string {
  if (value >= 0) {
    return value.toLocaleString();
  }
  return `+${(-value).toLocaleString()}`;
}

// 0→'0'、正→先頭 '-'、負→先頭 '+'（絶対値）。
// 支出向きに符号反転済みの値へさらに接頭辞を付ける表示に使う。
export function formatPrefixedSum(value: number): string {
  if (value === 0) {
    return '0';
  }
  if (value > 0) {
    return `-${value.toLocaleString()}`;
  }
  return `+${(-value).toLocaleString()}`;
}

// 0→'0'、支払はそのまま、受取は先頭 '+'。
export function formatByIsPay(value: number, isPay: boolean): string {
  if (value === 0) {
    return '0';
  }
  if (isPay) {
    return value.toLocaleString();
  }
  return `+${value.toLocaleString()}`;
}
