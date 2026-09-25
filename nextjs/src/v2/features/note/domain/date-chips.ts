import {
  addDaysJst,
  formatDateLabelJst,
  formatMonthDayJst
} from '@/lib/shared/domain/date';

// 入力フローの日付チップ（デザイン Note「今日 9/25 / 昨日 / おととい」）。
//
// 家計簿の記録はほぼ直近 3 日に収まるので、まずこの 3 択を出し、それ以外の日は
// カレンダーのシートから選ばせる。今日だけ M/D を添えるのは、他 2 つが今日を
// 起点にした相対表現で、起点が見えないと「昨日」がいつか分からないため。

export type DateChip = {
  date: string;
  label: string;
};

export function buildDateChips(today: string): DateChip[] {
  return [
    { date: today, label: `今日 ${formatMonthDayJst(today)}` },
    { date: addDaysJst(today, -1), label: '昨日' },
    { date: addDaysJst(today, -2), label: 'おととい' }
  ];
}

// 選択中の日が 3 択の外（カレンダーの選択日から来た・シートで選んだ）なら、
// その日を M月D日 のチップとして先頭に足す。選んだ日が見えないまま登録させない。
export function withSelectedChip(
  chips: DateChip[],
  selected: string
): DateChip[] {
  if (chips.some((chip) => chip.date === selected)) {
    return chips;
  }
  return [{ date: selected, label: formatDateLabelJst(selected) }, ...chips];
}
