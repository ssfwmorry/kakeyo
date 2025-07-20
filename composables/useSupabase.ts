import { getColorClassificationList } from '@/api/supabase/colorClassification';
import { getDayClassificationList } from '@/api/supabase/dayClassification';
import { deleteMemo, getMemoList, insertMemo } from '@/api/supabase/memo';
import { deleteMethod, getMethodList, swapMethod, upsertMethod } from '@/api/supabase/method';
import { deletePlan, getPlanList, upsertPlan } from '@/api/supabase/plan';
import {
  deletePlannedRecord,
  getPlannedRecordList,
  swapPlannedRecord,
  upsertPlannedRecord,
} from '@/api/supabase/plannedRecord';
import {
  deletePlanType,
  getPlanTypeList,
  swapPlanType,
  upsertPlanType,
} from '@/api/supabase/planType';
import {
  deleteRecord,
  getMethodSummary,
  getMonthSum,
  getPairedRecordList,
  getPayAndIncomeList,
  getRecordList,
  getSubTypeSummary,
  getSummarizedRecordList,
  getTypeSummary,
  postRecords,
  settleRecords,
  upsertRecord,
} from '@/api/supabase/record';
import { getShortCutList } from '@/api/supabase/shortCut';
import { deleteSubType, swapSubType, upsertSubType } from '@/api/supabase/subType';
import { deleteType, getTypeList, swapType, upsertType } from '@/api/supabase/type';
import { getPairId } from '@/api/supabase/user';

// VSCodeでのコードジャンプができるように、composables経由でAPIをコールする
export const useSupabase = () => {
  return {
    getPairId,
    getTypeList,
    upsertType,
    deleteType,
    swapType,
    upsertSubType,
    deleteSubType,
    swapSubType,
    getMethodList,
    upsertMethod,
    deleteMethod,
    swapMethod,
    getRecordList,
    upsertRecord,
    settleRecords,
    postRecords,
    deleteRecord,
    getPlannedRecordList,
    upsertPlannedRecord,
    deletePlannedRecord,
    swapPlannedRecord,
    getPlanList,
    upsertPlan,
    deletePlan,
    getPlanTypeList,
    upsertPlanType,
    deletePlanType,
    swapPlanType,
    getMemoList,
    insertMemo,
    deleteMemo,
    getShortCutList,
    getMonthSum,
    getTypeSummary,
    getMethodSummary,
    getSummarizedRecordList,
    getSubTypeSummary,
    getPairedRecordList,
    getPayAndIncomeList,
    getDayClassificationList,
    getColorClassificationList,
  };
};
