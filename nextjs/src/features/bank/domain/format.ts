// bank feature の表示整形ヘルパ（純粋関数・FE/BE 両用）。
// 金額の「入力パース」は lib/shared/domain/price が担う。こちらは bank 固有の
// 「表示単位（万・小数第一位）」への整形で責務が別（price.ts には混ぜない）。

// 円を万単位・小数第一位に丸める（旧 Nuxt の ConvertManUnit = Math.round(n/1000)/10）。
export function toManUnit(value: number): number {
  return Math.round(value / 1000) / 10;
}
