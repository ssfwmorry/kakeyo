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

// YYYY-MM-DD のみを DB の @db.Date へそのまま保存するための UTC 基準値。
// JS の Date は UTC を基準にするため、JST 0:00 そのものを表す 00:00Z を作り、
// 画面の選択日が 1 日ズレて保存されることを防ぐ。
export function dateOnlyValueJst(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
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

// YYYY-MM-DD（JST の暦日）に「今の JST 時刻」を載せた UTC の Date。
// 入力フォームは暦日しか持たないため、登録した時刻を残す record の datetime はここで合成する。
// 暦日は選択されたものを必ず保つ（now 側の日付は使わない）ので、日を跨ぐ瞬間でもマスの
// 所属日はズレない。
export function dateWithCurrentTimeJst(dateString: string): Date {
  const now = jst();
  return dayjs
    .tz(dateString, JST)
    .hour(now.hour())
    .minute(now.minute())
    .second(now.second())
    .millisecond(now.millisecond())
    .toDate();
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

// YYYY-MM（暦月）を months ヶ月ずらす。暦月の文字列計算なので tz 変換は挟まない。
export function addMonthsToYearMonthJst(
  yearMonth: string,
  months: number
): string {
  const total =
    Number(yearMonth.slice(0, 4)) * 12 +
    (Number(yearMonth.slice(5, 7)) - 1) +
    months;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`;
}

// 曜日（0=日 … 6=土）と、月内で何番目かの週（1〜5 か最終週）。
// 暦の概念なので feature ではなくここに置き、曜日を扱う層が共通で使う。
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type Nth = 1 | 2 | 3 | 4 | 5 | 'last';

// YYYY-MM-DD（JST の暦日）の曜日。
// 暦日の文字列そのものなので tz 変換は挟まない。
export function weekdayJst(dateStr: string): Weekday {
  // dayjs の day() は 0〜6 しか返さないので Weekday に収まる。
  return dayjs(dateStr).day() as Weekday;
}

// 日（1〜31）が属する月で、その曜日の何番目か。1〜5 に必ず収まる。
export function nthOfMonthJst(dateStr: string): Nth {
  const day = Number(dateStr.slice(8, 10));
  return (Math.floor((day - 1) / 7) + 1) as Nth;
}

// yearMonth（YYYY-MM）の「第 nth の weekday」を YYYY-MM-DD で返す。
// 第 5 週が存在しない月は null（呼び出し側が候補から捨てる）。
export function nthWeekdayOfMonthJst(
  yearMonth: string,
  nth: Nth,
  weekday: Weekday
): string | null {
  const first = dayjs(`${yearMonth}-01`);
  if (nth === 'last') {
    const last = first.endOf('month');
    // 末日から遡って直近の weekday。
    return last
      .subtract((last.day() - weekday + 7) % 7, 'day')
      .format(DATE_FORMAT);
  }
  // 月初から最初の weekday を求め、(nth - 1) 週進める。
  const offset = (weekday - first.day() + 7) % 7;
  const target = first.add(offset + (nth - 1) * 7, 'day');
  return target.month() === first.month() ? target.format(DATE_FORMAT) : null;
}

// YYYY-MM-DD に months ヶ月加算し、存在しない日は翌月へ繰り越す。
// 「およそ N ヶ月後」という相対的な間隔なので、月末で手前に縮める（clamp）より
// 溢れた分を送るほうが意図に合う（8/31 + 3 ヶ月 → 11/31 は無い → 12/1）。
// 繰り越しは dateInMonthJst（day が月の日数を超えると翌月へ繰り上がる）がそのまま持つ性質。
export function addMonthsOverflowJst(dateStr: string, months: number): string {
  return dateInMonthJst(
    dateStr.slice(0, 7),
    months,
    Number(dateStr.slice(8, 10))
  );
}

// YYYY-MM-DD に months ヶ月加算し、その月の day 日にする（月末を超えるなら末日へ押し込む）。
// day を rule 側に保持したまま呼ぶため、2 月で 28 に丸めても翌月は元の day に復帰する。
export function addMonthsClampJst(
  dateStr: string,
  months: number,
  day: number
): string {
  const [year, month] = dateStr.split('-').map(Number);
  const shifted = dayjs(`${year}-${String(month).padStart(2, '0')}-01`).add(
    months,
    'month'
  );
  return shifted.date(Math.min(day, shifted.daysInMonth())).format(DATE_FORMAT);
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
  const weekday = WEEKDAY_LABELS[weekdayJst(dateStr)];
  return `${formatDateLabelJst(dateStr)}(${weekday})`;
}
