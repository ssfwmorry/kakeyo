// カレンダーの月グリッドを組む純粋計算。
//
// 新デザインは FullCalendar をやめて自前のグリッドで描く。セルが
// 「日付・その日の収支・予定の帯」を縦に積む形で、帯が複数日にまたがるため、
// ライブラリの標準レイアウトに載せるより自前で持つほうが素直になった。
//
// 日付は 'YYYY-MM-DD' の文字列のまま扱う（JST の暦日そのもの。tz 変換を挟まない）。

// グリッドの 1 マス。月外の日も前後の月から詰めて 7 の倍数に揃える。
export type MonthCell = {
  dateStr: string;
  day: number;
  // 対象月の日か（前後の月から詰めた分は false）。
  isCurrentMonth: boolean;
  // 0=日曜 … 6=土曜。
  weekday: number;
};

// 'YYYY-MM' の月を、日曜始まりの 7 列グリッドに並べる。
// 週数は月によって 4〜6 週になるので、埋まる分だけ返す（固定 35 マスにしない）。
export function buildMonthGrid(yearMonth: string): MonthCell[] {
  const [year, month] = yearMonth.split('-').map(Number);
  if (!(year && month)) {
    return [];
  }

  // UTC で組み立てて日付だけを取り出す。ローカル tz に引きずられないようにする。
  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  const leading = firstDay.getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  // 先頭の空きと月の日数を合わせて 7 の倍数へ切り上げる。
  const totalCells = Math.ceil((leading + daysInMonth) / 7) * 7;

  const cells: MonthCell[] = [];
  for (let index = 0; index < totalCells; index++) {
    const date = new Date(Date.UTC(year, month - 1, index - leading + 1));
    cells.push({
      dateStr: toDateStr(date),
      day: date.getUTCDate(),
      isCurrentMonth: date.getUTCMonth() === month - 1,
      weekday: date.getUTCDay()
    });
  }
  return cells;
}

function toDateStr(date: Date): string {
  const year = String(date.getUTCFullYear()).padStart(4, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
