import { deleteBank, getBankList, upsertBank } from '~/api/supabase/bank';
import {
  getBankBalanceList,
  haveLatestBankBalance,
  postBankBalances,
} from '~/api/supabase/bankBalance';
import { getColorClassificationList } from '~/api/supabase/colorClassification';
import { getDayClassificationList } from '~/api/supabase/dayClassification';
import { deleteMemo, getMemoList, insertMemo } from '~/api/supabase/memo';
import { deleteMethod, getMethodList, swapMethod, upsertMethod } from '~/api/supabase/method';
import { deletePlan, getPlanList, upsertPlan } from '~/api/supabase/plan';
import {
  deletePlannedRecord,
  getPlannedRecordList,
  swapPlannedRecord,
  upsertPlannedRecord,
} from '~/api/supabase/plannedRecord';
import {
  deletePlanType,
  getPlanTypeList,
  swapPlanType,
  upsertPlanType,
} from '~/api/supabase/planType';
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
} from '~/api/supabase/record';
import {
  checkReminder,
  deleteReminder,
  getReminderList,
  insertReminder,
} from '~/api/supabase/reminder';
import { getShortCutList } from '~/api/supabase/shortCut';
import { deleteSubType, swapSubType, upsertSubType } from '~/api/supabase/subType';
import { deleteType, getTypeList, swapType, upsertType } from '~/api/supabase/type';
import { getPairId } from '~/api/supabase/user';

// VSCodeでのコードジャンプができるように、composables経由でAPIをコールする
export const useSupabase = () => {
  return {
    checkReminder,
    deleteBank,
    deleteMemo,
    deleteMethod,
    deletePlan,
    deletePlanType,
    deletePlannedRecord,
    deleteRecord,
    deleteReminder,
    deleteSubType,
    deleteType,
    getBankBalanceList,
    getBankList,
    getColorClassificationList,
    getDayClassificationList,
    getMemoList,
    getMethodList,
    getMethodSummary,
    getMonthSum,
    getPairId,
    getPairedRecordList,
    getPayAndIncomeList,
    getPlanList,
    getPlanTypeList,
    getPlannedRecordList,
    getRecordList,
    getReminderList,
    getShortCutList,
    getSubTypeSummary,
    getSummarizedRecordList,
    getTypeList,
    getTypeSummary,
    haveLatestBankBalance,
    insertMemo,
    insertReminder,
    postBankBalances,
    postRecords,
    settleRecords,
    swapMethod,
    swapPlanType,
    swapPlannedRecord,
    swapSubType,
    swapType,
    upsertMethod,
    upsertBank,
    upsertPlan,
    upsertPlanType,
    upsertPlannedRecord,
    upsertRecord,
    upsertSubType,
    upsertType,
  };
};
