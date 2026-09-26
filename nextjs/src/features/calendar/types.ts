import type { MemoItem } from '@/features/memo';
import type { PlanItem, ReminderItem } from '@/features/plan-reminder';
import type { RecordListItem } from '@/features/record';

// calendar 画面（ホーム）の FE 型（server-only を含まない）。
// record / plan-reminder / memo の公開型を束ね、カレンダー表示専用の
// 整形結果（日別収支）をここで定義する。

// 日別収支の 1 日分。日付クリックで records を出すため record 本体も保持する。
export type DaySum = {
  // JST の YYYY-MM-DD。
  dateStr: string;
  // 自分視点の当日収支。records が無ければ 0。
  sum: number;
  // その日の record 一覧（取得順のまま。表示側で整える）。
  records: RecordListItem[];
  // 祝日名（祝日でなければ null）。
  holidayName: string | null;
};

// カレンダー描画に必要なひと月分のデータ（Server で整形して Client へ渡す）。
export type CalendarMonthData = {
  // 対象の年月（YYYY-MM）。
  yearMonth: string;
  // 月の自分視点収支合計（正なら支出超過）。
  monthSum: number;
  // 期間内（前月21日〜翌月9日）の日別収支。
  days: DaySum[];
  // 期間内の予定。
  plans: PlanItem[];
  // 全リマインダー（表示は日付一致で拾う）。
  reminders: ReminderItem[];
};

// calendar 画面の初期表示に必要な全データ（page.tsx が SSR で解決して渡す）。
export type CalendarInitialData = {
  month: CalendarMonthData;
  memos: MemoItem[];
  hasPair: boolean;
  // ペアモード（共有 ON）。記録・予定・TODO 追加の isPair 既定に使う。
  isPair: boolean;
  // 初期フォーカス日（YYYY-MM-DD）。当日を SSR で解決して渡す。
  today: string;
};
