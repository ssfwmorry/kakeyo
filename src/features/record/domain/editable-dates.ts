import {
  firstDayOfMonthJst,
  lastDayOfMonthJst
} from '@/lib/shared/domain/date';

// 記録の日付を動かせる範囲。
//
// 記録は未来に付けられないので上限は今日。定期の記録から作られた記録は、実体化の
// 仕組み（月ごとに 1 件）を壊さないよう、元の記録と同じ月の中でだけ動かせる
// （サービス層の sameMonthOnly と同じ規則。ここは画面で先に止めるための計算）。
//
// 日付は 'YYYY-MM-DD' の文字列で、比較は文字列の大小で足りる。

export type EditableDateRange = {
  // null は下限なし。
  min: string | null;
  max: string;
};

export function editableDateRange({
  savedDate,
  isFromPlanned,
  today
}: {
  // 保存済みの日付。新規のときは undefined。
  savedDate: string | undefined;
  isFromPlanned: boolean;
  today: string;
}): EditableDateRange {
  if (savedDate === undefined || !isFromPlanned) {
    return { min: null, max: today };
  }
  const lastDay = lastDayOfMonthJst(savedDate);
  return {
    min: firstDayOfMonthJst(savedDate),
    max: lastDay < today ? lastDay : today
  };
}
