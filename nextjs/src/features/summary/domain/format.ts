// 金額表示整形は lib/shared/domain/priceDisplay に集約（calendar と同一の
// 「支出=正」表示ロジックを二重定義しないため）。ここでは別名を与えるのみ。
import {
  formatByIsPay,
  formatPrefixedSum,
  formatSignedSum
} from '@/lib/shared/domain/priceDisplay';

export const toShowStr = formatSignedSum;

export const toShowPrefixStr = formatPrefixedSum;

// isPay により符号表現を変える。
export const toShowStrWithIsPay = formatByIsPay;

const MAN = 10000;

// 棒グラフ Y 軸の目盛り表記。全体グラフ・カテゴリ別グラフで共有する。
//
// 目盛りは Recharts が実データのレンジから作るため、金額が小さい月やカテゴリでは
// 1 万未満の刻みになる。そこを万に丸めると「0万 0万 1万」と潰れて軸から絶対量が
// 読めなくなる（軸を出した目的そのものを失う）ので、1 万未満は素の桁区切りで出し、
// 1 万以上だけ万に丸めて軸幅を細く保つ。
export function toAxisTickStr(value: number): string {
  if (Math.abs(value) < MAN) {
    return value.toLocaleString();
  }
  return `${Math.round(value / MAN).toLocaleString()}万`;
}
