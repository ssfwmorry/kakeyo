import type { EventInput } from '@fullcalendar/core/index.js';
import type { GetRecordListItem } from '~/api/supabase/record.interface';
import type { DateString, Id } from '../common';

// 文字列の先頭は優先順位を表す数字にする
// eventOrder: 'type,start,-duration,allDay,title'
export const eventType = {
  HOLIDAY: '1_HOLIDAY',
  RECORD: '2_RECORD',
  REMINDER: '3_REMINDER',
  PLAN: '4_PLAN',
} as const;
export type DateRecordList = {
  //  record のデータ
  sum: number;
  records: GetRecordListItem[];
  // 日付のデータ
  isHoliday: boolean;
  holidayStr: string | null;
  dateLabel: string;
  dateStr: DateString;
  isInMonth: boolean; // その月のデータかどうか
};
export type CalendarList = Record<DateString, DateRecordList>;
export type ExternalEventPlan = {
  type: typeof eventType.PLAN;
  startStr: DateString;
  endStr: DateString;
  dbEnd: Date | null; // DBに登録されている終了日。このときBaseEventGetEndは次の日を示す
  memo: string | null;
  planId: number; // id はライブラリの定義に string として既存
  isPair: boolean;
  typeId: Id | null; // null はreminder経由で登録されたplan
  typeName: string | null; // null はreminder経由で登録されたplan
};
type ExternalEventRecord = {
  type: typeof eventType.RECORD;
  startStr: DateString;
};
type ExternalEventHoliday = {
  type: typeof eventType.HOLIDAY;
  startStr: DateString;
  // https://fullcalendar.io/docs/eventDisplay
  display: 'background';
};
type ExternalEventReminder = {
  type: typeof eventType.REMINDER;
  memo: string | null;
  reminderId: Id;
  isPair: boolean;
};
export type ExternalEvent =
  | ExternalEventPlan
  | ExternalEventRecord
  | ExternalEventHoliday
  | ExternalEventReminder;
// 内部変数として持っておくための型
export type BaseEventGet = {
  title: string;
  start: Date;
  end: Date | null;
  allDay: true;
  textColor: string;
  borderColor: string;
  backgroundColor: string;
  classNames: Array<string>;
};
export type EventGetPlan = BaseEventGet & ExternalEventPlan;

// ライブラリに登録する用の型
export type EventInputExpanded = EventInput & {
  title: string;
  start: Date;
  end: Date;
  allDay: true;
  textColor: string;
  borderColor: string;
  backgroundColor: string;
  classNames: Array<string>;
} & ExternalEvent;
