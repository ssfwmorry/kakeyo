import type { EventInput } from '@fullcalendar/core/index.js';
import type { GetRecordListItem } from '~/api/supabase/record.interface';
import type { DateString, Id } from '../common';

export const eventType = {
  PLAN: 'PLAN',
  RECORD: 'RECORD',
  HOLIDAY: 'HOLIDAY',
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
  type: 'PLAN';
  startStr: DateString;
  endStr: DateString;
  dbEnd: Date | null; // DBに登録されている終了日。このときBaseEventGetEndは次の日を示す
  memo: string | null;
  planId: number; // id はライブラリの定義に string として既存
  isPair: boolean;
  typeId: Id;
  typeName: string;
};
type ExternalEventRecord = {
  type: 'RECORD';
  startStr: DateString;
};
type ExternalEventHoliday = {
  type: 'HOLIDAY';
  startStr: DateString;
  // https://fullcalendar.io/docs/eventDisplay
  display: 'background';
};
export type ExternalEvent = ExternalEventPlan | ExternalEventRecord | ExternalEventHoliday;
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
