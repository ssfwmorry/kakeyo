// カレンダーの金額表示整形。実体は lib/shared/domain/priceDisplay に集約
// （summary と同一の「支出=正」表示ロジックを二重定義しないため）。
// 呼び出し側の名前（formatDaySum 等）は旧 StringUtility 由来のため、ここで別名を与える。
import {
  formatPrefixedSum,
  formatSignedSum
} from '@/lib/shared/domain/priceDisplay';

// 日別収支ラベルに使う。
export const formatDaySum = formatSignedSum;

// 月の収支合計サブタイトルに使う。
export const formatMonthSum = formatPrefixedSum;

// record カードの金額表示は record ドメインの共通 RecordCard に集約したため、
// ここの formatRecordPrice（formatByIsPay）は廃止（旧 RecordCard は符号なし＋収入青字）。
