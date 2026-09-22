// カレンダーの金額表示整形。実体は lib/shared/domain/priceDisplay に集約
// （summary と同一の「支出=正」表示ロジックを二重定義しないため）。
// 呼び出し側の名前（formatDaySum 等）は旧 StringUtility 由来のため、ここで別名を与える。
import {
  formatByIsPay,
  formatPrefixedSum,
  formatSignedSum
} from '@/lib/shared/domain/priceDisplay';

// 日別収支ラベルに使う。
export const formatDaySum = formatSignedSum;

// 月の収支合計サブタイトルに使う。
export const formatMonthSum = formatPrefixedSum;

// record の表示金額（支払はそのまま、受取は先頭 '+'、0 は '0'）。
export const formatRecordPrice = formatByIsPay;
