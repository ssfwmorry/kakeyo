// 精算の按分レート定数（旧 utils/constants/color.ts の RATE_* を移植）。
// レートは「自分（立替を記録した側の視点での本人）が負担すべき割合」を表す 11 段階。
// index 0 = 10:0（自分が全額負担）〜 index 5 = 5:5（割り勘）〜 index 10 = 0:10（相手が全額）。
// server-only を含まない純粋データ（Client / Vitest から利用可）。

// 自分の負担比率（旧 RATE_LIST）。reportedDataByRate の toBe = round(sum * rate)。
export const RATE_LIST = [
  1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1, 0
] as const;

// レートのラベル（旧 RATE_LABEL_LIST）。中央（index 5）は「割り勘」表記。
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

// レート色（旧 RATE_COLOR_LIST の Vuetify トークンを hex へ読み替え）。
// 自分負担が多いほど赤系、割り勘は紫、相手負担が多いほど青系（旧の色意図を踏襲）。
export const RATE_COLOR_LIST = [
  '#d50000', // red-accent-4（自分 10）
  '#ff1744', // red-accent-3
  '#ff5252', // red-accent-2
  '#ff8a80', // red-accent-1
  '#e57373', // red-lighten-3
  '#ba68c8', // purple lighten-2（割り勘）
  '#90caf9', // blue-lighten-3
  '#448aff', // blue-accent-1
  '#2979ff', // blue-accent-2
  '#2962ff', // blue-accent-3（相手 9）
  '#1a237e' // blue-accent-4 相当（相手 10）
] as const;

// レート段階数（11）。
export const RATE_COUNT = RATE_LIST.length;

// index の妥当性（0〜10）。
export function isValidRateIndex(index: number): boolean {
  return Number.isInteger(index) && index >= 0 && index < RATE_COUNT;
}
