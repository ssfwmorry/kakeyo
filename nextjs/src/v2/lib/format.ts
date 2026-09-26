import dayjs from 'dayjs';
import { todayJst } from '@/lib/shared/domain/date';

// 新デザインの日付・金額の表示書式。デザイン基礎の書式（全角括弧の曜日・U+2212 の
// マイナス・桁区切り）をここに集める。暦日は 'YYYY-MM-DD' の文字列で受け、
// 曜日は暦日そのものから引くので tz 変換は挟まない。

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'] as const;

function parts(dateStr: string): { year: number; month: number; day: number } {
  const [year, month, day] = dateStr.split('-').map(Number);
  return { year, month, day };
}

function weekday(dateStr: string): string {
  return WEEKDAY_LABELS[dayjs(dateStr).day()];
}

// 'YYYY-MM-DD' → '9月25日（金）'。日別見出し・入力の日付・削除確認の本文。
// withYear を渡すと '2027年1月5日（火）' のように年を前置する（省略時は付けない）。
// today を渡すと今年以外の日付にだけ年を付ける（リマインダーの日付）。
export function formatMonthDayWeekJa(
  dateStr: string,
  options: { withYear?: boolean; today?: string } = {}
): string {
  const { year, month, day } = parts(dateStr);
  const withYear =
    options.withYear ??
    (options.today !== undefined && parts(options.today).year !== year);
  const prefix = withYear ? `${year}年` : '';
  return `${prefix}${month}月${day}日（${weekday(dateStr)}）`;
}

// 'YYYY-MM-DD' → '9/25（金）'。予定の日付ボタン・リマインダー・お知らせ。
// 今年以外の日付は '2027年1/5（火）' のように年を前置する（withYear で強制もできる）。
export function formatSlashDateWeekJa(
  dateStr: string,
  options: { withYear?: boolean; today?: string } = {}
): string {
  const { year, month, day } = parts(dateStr);
  const thisYear = parts(options.today ?? todayJst()).year;
  const withYear = options.withYear ?? year !== thisYear;
  const prefix = withYear ? `${year}年` : '';
  return `${prefix}${month}/${day}（${weekday(dateStr)}）`;
}

// 'YYYY-MM-DD' → '2026/9/25'。残高登録の記録日。
export function formatSlashDate(dateStr: string): string {
  const { year, month, day } = parts(dateStr);
  return `${year}/${month}/${day}`;
}

// 'YYYY-MM-DD' → '9/25'。総資産の「9/25 時点」など。
export function formatSlashMonthDay(dateStr: string): string {
  const { month, day } = parts(dateStr);
  return `${month}/${day}`;
}

// U+2212。ハイフンより幅があり数字と並べたときに揃う。デザインはこれで統一している。
export const MINUS_SIGN = '−';

// 金額に符号を付けて桁区切りで出す。支出は '−2,480'、収入は '+320,000'。
// 0 は符号無し。
export function formatSignedPrice(price: number, isPay: boolean): string {
  const abs = Math.abs(price).toLocaleString('ja-JP');
  if (price === 0) {
    return abs;
  }
  return `${isPay ? MINUS_SIGN : '+'}${abs}`;
}

// 対象名をかぎかっこで囲む。トーストや確認の本文で使う（「通院」を削除しました）。
export function quoted(name: string): string {
  return `「${name}」`;
}
