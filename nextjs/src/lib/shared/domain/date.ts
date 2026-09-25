import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

// JST 日付境界のドメイン計算（日付の単一の正）。
// 「Date に +9h して toISOString で切る」独自 JST 変換は使わない。SSR ではサーバ
// （Vercel は UTC）とクライアントで時刻がズレるため、dayjs の utc/timezone で
// Asia/Tokyo を明示し日付境界（YYYY-MM-DD）で一貫して扱う。
// 「今日」は全機能の起点なので、自前で日付変換せずここを経由する。

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

// YYYY-MM-DD（JST の暦日）の、その日の JST 23:59:59.999 に対応する UTC の Date。
// 期間取得の上限（両端含む gte..lte）に使う（startOfDayJst の対）。
export function endOfDayJst(dateString: string): Date {
  return dayjs.tz(dateString, JST).endOf('day').toDate();
}

// 基準年月（YYYY-MM）から monthOffset ヶ月ずらした月の day 日を YYYY-MM-DD で返す。
// 「前月 21 日」「翌月 9 日」のようなカレンダー表示範囲端の算出に使う。
// day が対象月の日数を超える場合は dayjs が翌月へ繰り上げる点に注意（呼び出し側は
// 実在する日を渡す前提）。
export function dateInMonthJst(
  yearMonth: string,
  monthOffset: number,
  day: number
): string {
  return dayjs
    .tz(yearMonth, JST)
    .startOf('month')
    .add(monthOffset, 'month')
    .date(day)
    .format(DATE_FORMAT);
}

// YYYY-MM（JST の暦月）の月初 0:00 に対応する UTC の Date。集計の期間下限に使う。
export function startOfMonthJst(yearMonth: string): Date {
  return dayjs.tz(yearMonth, JST).startOf('month').toDate();
}

// YYYY-MM（JST の暦月）の翌月初 0:00 に対応する UTC の Date。集計の期間上限（未満）に使う。
export function startOfNextMonthJst(yearMonth: string): Date {
  return dayjs.tz(yearMonth, JST).add(1, 'month').startOf('month').toDate();
}

// YYYY-MM-DD（JST の暦日）を days 日ずらす（負なら過去）。「昨日」「おととい」の算出に使う。
// 暦日の文字列同士の計算なので tz 変換は挟まない。
export function addDaysJst(dateStr: string, days: number): string {
  return dayjs(dateStr).add(days, 'day').format(DATE_FORMAT);
}

// YYYY-MM-DD（JST の暦日）が属する月の 1 日。
export function firstDayOfMonthJst(dateStr: string): string {
  return dayjs(dateStr).startOf('month').format(DATE_FORMAT);
}

// YYYY-MM-DD（JST の暦日）が属する月の末日。
export function lastDayOfMonthJst(dateStr: string): string {
  return dayjs(dateStr).endOf('month').format(DATE_FORMAT);
}

// 2 つの暦日（YYYY-MM-DD）の差を日数で返す（a − b）。「N 日過ぎています」の算出に使う。
// 暦日の文字列同士の計算なので tz 変換は挟まない。
export function diffDaysJst(a: string, b: string): number {
  return dayjs(a).diff(dayjs(b), 'day');
}

// 'YYYY-MM-DD' → 'M/D'。日付チップのように短く出す場所の整形。
export function formatMonthDayJst(dateStr: string): string {
  const [, month, day] = dateStr.split('-');
  return `${Number(month)}/${Number(day)}`;
}

// 'YYYY-MM-DD' → 'M月D日'。日別見出しの表示整形。
// 生の ISO 文字列を見出しに出すと日本語 UI として不自然なため、表示側はこれを通す。
export function formatDateLabelJst(dateStr: string): string {
  const [, month, day] = dateStr.split('-');
  return `${Number(month)}月${Number(day)}日`;
}

// startStr〜endStr（両端含む・YYYY-MM-DD）の暦日を昇順で列挙する。
// 逆順（end < start）なら空配列。
export function listDatesJst(startStr: string, endStr: string): string[] {
  const dates: string[] = [];
  let cursor = dayjs(startStr);
  const end = dayjs(endStr);
  while (!cursor.isAfter(end, 'day')) {
    dates.push(cursor.format(DATE_FORMAT));
    cursor = cursor.add(1, 'day');
  }
  return dates;
}

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'] as const;

// 'YYYY-MM-DD' → 'M月D日(曜)'。
// 暦日は JST の文字列そのものなので、tz 変換を挟まず暦日として曜日を引く。
export function formatDateWithWeekdayJst(dateStr: string): string {
  const weekday = WEEKDAY_LABELS[dayjs(dateStr).day()];
  return `${formatDateLabelJst(dateStr)}(${weekday})`;
}
