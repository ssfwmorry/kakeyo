import { MAX_PRICE } from './price';

// 電卓式テンキーの押下ロジック（純粋関数・単一の正・Vitest 保護）。
// 旧 components/NotePrice.vue の pushPrice / pushDoubleZero / popPrice を移植。
// 金額は number で保持し、UI 層で文字列（hidden 送信値）と橋渡しする。
// 上限は price.ts の MAX_PRICE（「未満」）を踏襲し、桁上げで超える操作は無視する
//   （旧: `model*10+num < MAX_PRICE` のときだけ加算）。

// 数字（0-9）を 1 桁 push する。上限を超える場合は現状維持。
export function pushDigit(current: number, digit: number): number {
  if (current === 0) {
    // 先頭 0 は上書き（"0" のあとに 5 → 5）。単独の 0 は上限判定不要。
    return digit;
  }
  const next = current * 10 + digit;
  return next < MAX_PRICE ? next : current;
}

// "00" を push する（*100）。上限を超える場合は現状維持。
export function pushDoubleZero(current: number): number {
  if (current === 0) {
    return 0;
  }
  const next = current * 100;
  return next < MAX_PRICE ? next : current;
}

// バックスペース（末尾 1 桁削除 = Math.floor(current / 10)）。
export function popDigit(current: number): number {
  return Math.floor(current / 10);
}
