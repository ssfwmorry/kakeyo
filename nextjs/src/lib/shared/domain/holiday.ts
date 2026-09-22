import JapaneseHolidays from 'japanese-holidays';

// 日本の祝日名を返すドメイン関数（凍結資産・祝日判定の単一の正）。
// 旧 utils/time.ts の GetHolidayName を移植。japanese-holidays は型を持たないため
// calendar feature 側で declare module して読み込む（このモジュールは lib/shared に
// 属するがカレンダー以外からも祝日名を引けるよう共有ドメインに置く）。
//
// 入力は JST の暦日（YYYY-MM-DD）。month は 1-12 で受け取り、Date へは 0-11 に直す。
// 祝日でなければ null を返す。旧実装同様、ローカルタイムの Date で判定する
// （YYYY-MM-DD をそのままローカル暦日として解釈し、UTC 変換で日付がずれないようにする）。
export function getHolidayName(dateString: string): string | null {
  if (!dateString) {
    return null;
  }
  const [year, month, day] = dateString.split('-').map(Number);
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    return null;
  }
  return JapaneseHolidays.isHolidayAt(new Date(year, month - 1, day)) ?? null;
}
