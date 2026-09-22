// summary/records 画面の金額表示整形（純粋関数・FE/BE 両用）。
// 旧 Nuxt の StringUtility を踏襲する。金額の「入力パース」は lib/shared/domain/price、
// bank の「万単位」整形とは責務が別なのでここに summary 固有の整形を置く。

// 旧 ConvertIntToShowStr: 正/0 はそのまま桁区切り、負は先頭 '+' を付けて絶対値表示。
// （records の合計・pie 一覧の金額に使う。収支の符号を「支出=正」の向きで見せる旧仕様）。
export function toShowStr(value: number): string {
  if (value >= 0) {
    return value.toLocaleString();
  }
  return `+${(-value).toLocaleString()}`;
}

// 旧 ConvertIntToShowPrefixStr: 0→'0'、正→先頭 '-'、負→先頭 '+'（絶対値）。
// SummaryBar の収支合計表示（支出向きに符号反転済みの値へさらに接頭辞を付ける）に使う。
export function toShowPrefixStr(value: number): string {
  if (value === 0) {
    return '0';
  }
  if (value > 0) {
    return `-${value.toLocaleString()}`;
  }
  return `+${(-value).toLocaleString()}`;
}

// 旧 ConvertIntToShowStrWithIsPay: 0→'0'、支払時はそのまま、受取時は先頭 '+'。
// pie の月合計サブタイトルに使う（isPay により符号表現を変える）。
export function toShowStrWithIsPay(value: number, isPay: boolean): string {
  if (value === 0) {
    return '0';
  }
  if (isPay) {
    return value.toLocaleString();
  }
  return `+${value.toLocaleString()}`;
}
