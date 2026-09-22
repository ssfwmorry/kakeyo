// カレンダーの金額表示整形。実体は lib/shared/domain/priceDisplay に集約
// （summary と同一の「支出=正」表示ロジックを二重定義しないため）。
import {
  formatPrefixedSum,
  formatSignedSum
} from '@/lib/shared/domain/priceDisplay';

// 日別収支ラベルに使う。
export const formatDaySum = formatSignedSum;

// 月の収支合計サブタイトルに使う。
export const formatMonthSum = formatPrefixedSum;
