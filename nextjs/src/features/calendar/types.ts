import type { MemoItem, ShortCutItem } from '@/features/memo-shortcut';
import type { PlanItem, ReminderItem } from '@/features/plan-reminder';
import type { RecordListItem } from '@/features/record';
import type { Id } from '@/lib/shared/types/id';

// calendar 統合画面（ホーム）の FE 型（server-only を含まない）。
// record / plan-reminder / memo-shortcut の公開型を束ね、カレンダー表示専用の
// 整形結果（日別収支・イベント）をここで定義する。

// 日別収支の 1 日分。日付クリックで records を出すため record 本体も保持する。
export type DaySum = {
  // JST の YYYY-MM-DD。
  dateStr: string;
  // 自分視点の当日収支（旧 daySumList の sum）。records が無ければ 0。
  sum: number;
  // その日の record 一覧（新しい順ではなく取得順のまま。表示側で整える）。
  records: RecordListItem[];
  // 祝日名（祝日でなければ null）。
  holidayName: string | null;
};

// カレンダー描画に必要なひと月分のデータ（Server で整形して Client へ渡す）。
export type CalendarMonthData = {
  // 対象の年月（YYYY-MM）。
  yearMonth: string;
  // 月の自分視点収支合計（旧 getMonthSum。正なら支出超過）。
  monthSum: number;
  // 期間内（前月21日〜翌月9日相当）の日別収支。dateStr をキーにした配列。
  days: DaySum[];
  // 期間内の予定。
  plans: PlanItem[];
  // 全リマインダー（表示は日付一致で拾う）。
  reminders: ReminderItem[];
};

// calendar 統合画面の初期表示に必要な全データ（page.tsx が SSR で解決して渡す）。
export type CalendarInitialData = {
  month: CalendarMonthData;
  memos: MemoItem[];
  shortcuts: ShortCutItem[];
  hasPair: boolean;
  // ペアモード（共有 ON）。ショートカット記録・TODO 追加の isPair 既定に使う。
  isPair: boolean;
  // 初期フォーカス日（YYYY-MM-DD）。当日を SSR で解決して渡す。
  today: string;
};

// FullCalendar へ渡すイベント（Client 側で FullCalendar の EventInput へ変換する前段の
// 素朴な形。Server→Client を JSON で跨げるようプリミティブのみ）。
export type CalendarEventKind = 'plan' | 'reminder' | 'daySum';

export type CalendarEvent = {
  kind: CalendarEventKind;
  // YYYY-MM-DD。
  start: string;
  // plan の終了日（YYYY-MM-DD）。単日イベントは start と同じ。
  end: string;
  title: string;
  // 枠線/文字色に使う hex（daySum は色なし=null）。
  colorHex: string | null;
  // 参照元の id（plan / reminder のクリック識別に使う。daySum は null）。
  planId: Id | null;
  reminderId: Id | null;
};
