// 精算率の定数。率は「自分（見ている本人）が負担すべき割合」を表す 11 段階で、
// index 0 = 10：0（自分が全額）〜 index 5 = 割り勘 〜 index 10 = 0：10（相手が全額）。
// server-only を含まない純粋データ（Client / Vitest から使う）。

// 自分の負担比率。toBe = round(合計 * rate)。
export const RATE_LIST = [
  1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1, 0
] as const;

export const RATE_LABEL_LIST = [
  '10：0',
  '9：1',
  '8：2',
  '7：3',
  '6：4',
  '割り勘',
  '4：6',
  '3：7',
  '2：8',
  '1：9',
  '0：10'
] as const;

// 率の説明。割り勘だけは比率そのものを添える（原典の「割り勘 5：5」）。
export const RATE_CAPTION_LIST = [
  '自分が全額',
  '自分が9割',
  '自分が8割',
  '自分が7割',
  '自分が6割',
  '5：5',
  '相手が6割',
  '相手が7割',
  '相手が8割',
  '相手が9割',
  '相手が全額'
] as const;

export const RATE_COUNT = RATE_LIST.length;
export const HALF_RATE_INDEX = 5;

// 率シートの並び。左列に「自分が多く負担」、右列に「相手が多く負担」を対にして 5 行に流す
// （原典 SumSettle の rates）。割り勘は別枠で下に置く。
export const RATE_SHEET_ORDER = [0, 10, 1, 9, 2, 8, 3, 7, 4, 6] as const;

// 率の色。globals.css の --rate-0〜10（自分寄りは橙、割り勘は紫、相手寄りは青）。
// カテゴリ色（--cat-*）とは別系統なので、色名ではなく index で引く。
export function rateColor(index: number): string {
  return `var(--rate-${index})`;
}

// 率の淡い面（割当済みの行の地・グループのバッジの地）。予定の帯と同じ混ぜ方。
export function rateTint(index: number): string {
  return `color-mix(in srgb, ${rateColor(index)} var(--band-mix), var(--card))`;
}

export function isValidRateIndex(index: number): boolean {
  return Number.isInteger(index) && index >= 0 && index < RATE_COUNT;
}
