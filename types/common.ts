export const format = {
  Date: 'YYYY-MM-DD',
  MonthDate: 'MM/DD',
} as const;

export const page = {
  BANK: 'bank',
  CALENDAR: 'calendar',
  INDEX: '/',
  INQURY: 'inqury',
  LOGIN: 'login',
  NOTE: 'note',
  PLAN: 'plan',
  RECORDS: 'records',
  SUMMARY: 'summary',
  SETTING: 'setting',
} as const;

export const dummy = {
  bl: false, // boolean
  nm: -1, //number
  str: 'dummy',
  dt: new Date(), // date
  dtStr: 'YYYY-MM-DD', // dateString
  dttStr: 'YYYY-MM-DD HH:MM:SS', // datatimeString
};

export const routerParamKey = {
  PLANNED_RECORD: 'PLANNED_RECORD',
  RECORD: 'RECORD',
  PLAN: 'PLAN',
} as const;
export type RouterParamKey = (typeof routerParamKey)[keyof typeof routerParamKey];

export const crud = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
} as const;
export type Crud = (typeof crud)[keyof typeof crud];

export type RouterQueryCalendarToNote = {
  routerParamKey: (typeof routerParamKey)[keyof typeof routerParamKey];
  crud: Crud;
};
export type RouterQueryNoteToCalendar = {
  focus: DateString;
};
export type RouterQueryCalendarToPlan = {
  crud: Crud;
};
export type RouterQueryPlanToCalendar = {
  focus: DateString;
};

export type Id = number;
export type DateString = string; // YYYY-MM-DD
export type DatetimeString = string; // YYYY-MM-DD HH:MM:SS
export type DbDatetimeString = string; // ex..2024-12-31T20:06:38+09:00

export const boolStr = {
  TRUE: 'true',
  FALSE: 'false',
} as const;
export type BoolString = (typeof boolStr)[keyof typeof boolStr];

export type PickeredDate = {
  $y: number;
  $M: number;
  $D: number;
};

export type Plan = {
  id: number;
  start_date: DateString;
  end_date: DateString;
  name: string;
  memo: string | null;
  is_pair: boolean;
  plan_type_id: number;
  plan_type_name: string;
  plan_type_color_classification_name: string;
};

export const shareType = {
  SELF: 'SELF',
  PAIR: 'PAIR',
  BOTH: 'BOTH',
} as const;
export type ShareType = (typeof shareType)[keyof typeof shareType];

export type DateRange = {
  start: DateString;
  end: DateString;
};

export type SupabaseApiAuth = {
  isDemoLogin: boolean;
};
export type SupabaseApiAuthGet = {
  userUid: string;
} & SupabaseApiAuth;
export type SupabaseApiAuthUpsert = {
  isPair: boolean;
  pairId: number;
} & SupabaseApiAuthGet;

export const eventType = {
  PLAN: 'PLAN',
  RECORD: 'RECORD',
  HOLIDAY: 'HOLIDAY',
} as const;
export type ExternalEventPlan = {
  type: 'PLAN';
  startStr: DateString;
  endStr: DateString;
  dbEnd: Date | null; // DBに登録されている終了日。このときBaseEventGetendは次の日を示す
  memo: string | null;
  planId: number; // id はライブラリの定義に string として既存
  isPair: boolean;
  typeId: number;
  typeName: string;
};
export type ExternalEventRecord = {
  type: 'RECORD';
  startStr: DateString;
};
export type ExternalEventHoliday = {
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
export type EventGetRecord = BaseEventGet & ExternalEventRecord;
export type EventGet = EventGetPlan | EventGetRecord;

// ライブラリに登録する用の型
export type EventSet = {
  title: string;
  start: Date;
  end: Date;
  allDay: true;
  textColor: string;
  borderColor: string;
  backgroundColor: string;
  classNames: Array<string>;
} & ExternalEvent;

export type Record_ = {
  id: number;
  datetime: DatetimeString;
  is_instead: boolean | null;
  is_pair: boolean;
  is_pay: boolean;
  is_self: boolean | null;
  memo: string | null | undefined; // toto 精査
  method_color_classification_name: string;
  method_id: number;
  method_name: string;
  pair_user_name: string | null;
  planned_record_id: number | null;
  price: number;
  sub_type_id: number | null;
  sub_type_name: string | null;
  type_color_classification_name: string;
  type_id: number;
  type_name: string;
};

export type DateRecordList = Record<
  ShareType,
  {
    // recordがない場合はnull
    sum: number | null;
    records: Record_[];
  }
> & { isHoliday: boolean; holidayStr: string | null };

export type CalendarList = Record<DateString, DateRecordList>;

export type UpsertRecordInput = {
  id: number | null;
  datetime: DatetimeString;
  isPay: boolean;
  methodId: number;
  isInstead: boolean | null;
  typeId: number;
  subTypeId: number | null;
  price: number;
  memo: string | null;
};

export type GetRecordListRpc = {
  record_id: number;
  is_self: boolean;
  datetime: DbDatetimeString;
  is_pay: boolean;
  price: number;
  memo: string | null;
  is_instead: boolean;
  planned_record_id: number | null;
  method_id: number;
  method_name: string;
  method_color_classification_name: string;
  type_id: number;
  type_name: string;
  sub_type_id: number | null;
  sub_type_name: string | null;
  type_color_classification_name: string;
  is_pair: boolean;
  pair_user_name: string | null;
};
