// summary/records 画面の金額表示整形。実体は lib/shared/domain/priceDisplay に集約
// （calendar と同一の「支出=正」表示ロジックを二重定義しないため）。
// 呼び出し側の名前（toShowStr 等）は旧 StringUtility 由来のため、ここで別名を与える。
import {
  formatByIsPay,
  formatPrefixedSum,
  formatSignedSum
} from '@/lib/shared/domain/priceDisplay';

// records の合計・pie 一覧の金額に使う。
export const toShowStr = formatSignedSum;

// SummaryBar の収支合計表示に使う。
export const toShowPrefixStr = formatPrefixedSum;

// pie の月合計サブタイトルに使う（isPay により符号表現を変える）。
export const toShowStrWithIsPay = formatByIsPay;
