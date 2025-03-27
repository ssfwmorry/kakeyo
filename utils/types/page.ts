import type { ColorString, YearMonthObj } from './common';
import type { Plan as PlanModel, PlannedRecord as PlannedRecordModel } from './model';

export const routerParamKey = {
  PLANNED_RECORD: 'PLANNED_RECORD',
  RECORD: 'RECORD',
  PLAN: 'PLAN',
  RECORDS_QUERY_PARAM: 'RECORDS_QUERY_PARAM',
  SUMMARY_QUERY_PARAM: 'SUMMARY_QUERY_PARAM',
} as const;
export type RouterParamKey = (typeof routerParamKey)[keyof typeof routerParamKey];

export type SummaryQueryParam = {
  isPay: boolean;
  isType: boolean;
  isMonth: boolean;
  focus: YearMonthObj;
};

export type RecordsQueryParam = {
  id: number;
  subtypeId: number | null;
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

export type PlannedRecord = Omit<PlannedRecordModel, 'userId' | 'pairId'> & {
  pairUserName: string | null;
};

export type Plan = Omit<PlanModel, 'userId' | 'pairId'> & {
  isPair: boolean;
  planTypeName: string;
  planTypeColorClassificationName: string;
};
