// japanese-holidays（1.0.10）は型定義を同梱しないため、このレーンで使う最小 API のみ
// アンビエント宣言する。lib/shared/domain/holiday.ts が唯一の利用者。
// tsconfig の include が **/*.ts を対象にするため、この宣言はプロジェクト全体で有効になる
// （lib/shared/domain を汚さず、型宣言を calendar feature 内にコロケーションする狙い）。
declare module 'japanese-holidays' {
  // 指定日が祝日ならその名称、そうでなければ undefined を返す。
  // 祝日名の取得に使う唯一の関数。
  export function isHolidayAt(date: Date): string | undefined;
  const JapaneseHolidays: {
    isHolidayAt(date: Date): string | undefined;
  };
  export default JapaneseHolidays;
}
