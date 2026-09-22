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
