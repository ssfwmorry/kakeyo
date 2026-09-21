import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

// JST 日付境界のドメイン計算（凍結資産・日付の単一の正）。
// 旧「Date に +9h して toISOString で切る」独自 JST 変換は廃止。SSR ではサーバ
// （Vercel は UTC）とクライアントで時刻がズレるため、dayjs の utc/timezone で
// Asia/Tokyo を明示し日付境界（YYYY-MM-DD）で一貫して扱う。
// 「今日」は全機能の起点なので、各レーンは自前で日付変換せずここを経由する。

dayjs.extend(utc);
dayjs.extend(timezone);

const JST = 'Asia/Tokyo';
const DATE_FORMAT = 'YYYY-MM-DD';
const YEAR_MONTH_FORMAT = 'YYYY-MM';

function jst(value?: Date | string): dayjs.Dayjs {
  return dayjs(value).tz(JST);
}

// JST における「今日」を YYYY-MM-DD で返す。全機能の日付起点。
export function todayJst(): string {
  return jst().format(DATE_FORMAT);
}

// 任意の日時を JST の YYYY-MM-DD 文字列に丸める。
export function toDateStringJst(value: Date | string): string {
  return jst(value).format(DATE_FORMAT);
}

// 任意の日時を JST の YYYY-MM（年月）文字列に丸める。集計の月キーに使う。
export function toYearMonthJst(value: Date | string): string {
  return jst(value).format(YEAR_MONTH_FORMAT);
}

// YYYY-MM-DD（JST の暦日）を、その日の JST 0:00 に対応する UTC の Date にする。
// Timestamptz カラム（records.datetime 等）へ「JST のこの日」を保存する起点。
export function startOfDayJst(dateString: string): Date {
  return dayjs.tz(dateString, JST).startOf('day').toDate();
}

// YYYY-MM（JST の暦月）の月初 0:00 に対応する UTC の Date。集計の期間下限に使う。
export function startOfMonthJst(yearMonth: string): Date {
  return dayjs.tz(yearMonth, JST).startOf('month').toDate();
}

// YYYY-MM（JST の暦月）の翌月初 0:00 に対応する UTC の Date。集計の期間上限（未満）に使う。
export function startOfNextMonthJst(yearMonth: string): Date {
  return dayjs.tz(yearMonth, JST).add(1, 'month').startOf('month').toDate();
}
