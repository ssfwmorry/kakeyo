// 'YYYY-MM-DD'（ローカル暦日）と Date の相互変換（plan の日付ピッカー用の純粋関数）。
// react-day-picker はローカル暦日の Date を扱うため、ここでは UTC/JST 変換を挟まず
// 素朴なローカル日付として往復させる（lib/shared/domain/date.ts は UTC↔JST 境界変換の
// 責務で、tz を通すと日付キーがずれるため用途が異なる。month-calendar と同じ整理）。

// 'YYYY-MM-DD' → ローカル暦日の Date（不正・空文字は undefined）。
export function parseLocalDate(value: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return undefined;
  }
  const [, y, m, d] = match;
  return new Date(Number(y), Number(m) - 1, Number(d));
}

// ローカル暦日の Date → 'YYYY-MM-DD'。
export function formatLocalDate(date: Date): string {
  const y = String(date.getFullYear()).padStart(4, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
