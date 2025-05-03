import type { LocationQuery } from 'vue-router';
import type { ColorString, DateString, DatetimeString, Id, YearMonthObj } from './common';
import type {
  Plan as PlanModel,
  PlannedRecord as PlannedRecordModel,
  Record_ as RecordModel,
} from './model';

export const RouterParamKey = {
  PLANNED_RECORD: 'PLANNED_RECORD',
  RECORD: 'RECORD',
  PLAN: 'PLAN',
  RECORDS_QUERY_PARAM: 'RECORDS_QUERY_PARAM',
  SUMMARY_QUERY_PARAM: 'SUMMARY_QUERY_PARAM',
} as const;
export type RouterParamKey = (typeof RouterParamKey)[keyof typeof RouterParamKey];

export type SummaryQueryParam = {
  isPay: boolean;
  isType: boolean;
  isMonth: boolean;
  focus: YearMonthObj;
};

export type RecordsQueryParam = {
  id: Id;
  subtypeId: Id | null;
  isPay: boolean;
  isMonth: boolean;
  isType: boolean;
  isPair: boolean;
  isIncludeInstead: boolean | null;
  focus: YearMonthObj;
  name: string;
  color: ColorString;
  pairUserName: string | null;
};

export type PageQueryParameter = LocationQuery & {
  key: RouterParamKey;
};
export type RouterQueryNoteToCalendar = {
  focus: DateString;
};
export type RouterQueryPlanToCalendar = {
  focus: DateString;
};

export type PlannedRecord = Omit<PlannedRecordModel, 'userId' | 'pairId'> & {
  pairUserName: string | null;
};

export type Plan =
  /** Create */
  | ({ id: null; isPair: boolean } & Pick<PlanModel, 'startDate' | 'endDate'>)
  /** Select/ Update / Delete */
  | (Omit<PlanModel, 'userId' | 'pairId'> & {
      isPair: boolean;
      planTypeName: string;
      planTypeColorClassificationName: string;
    });

export type Record_ =
  /** Create */
  | { id: null; datetime: DatetimeString }
  /** Select / Update / Delete */
  | (Omit<RecordModel, 'userId' | 'isPay' | 'pairId' | 'isSettled'> & {
      isPay: boolean;
      isPair: boolean;
      isInstead: boolean | null;
    });
