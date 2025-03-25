import supabase from '@/composables/supabase';
import { DEMO_DATA } from '@/utils/constants';
import { camelizeKeys } from 'humps';
import type {
  DeleteInput,
  DeleteOutput,
  SupabaseApiAuth,
  SupabaseApiAuthGet,
  SupabaseApiAuthUpsert,
  UpsertOutput,
} from './common.interface';
import type {
  GetMethodSummaryInput,
  GetMethodSummaryOutput,
  GetMonthSumInput,
  GetMonthSumOutput,
  GetPairedRecordListInput,
  GetPairedRecordListOutput,
  GetPayAndIncomeListInput,
  GetPayAndIncomeListOutput,
  GetRecordListInput,
  GetRecordListOutput,
  GetSummarizedRecordListInput,
  GetSummarizedRecordListOutput,
  GetTypeSummaryInput,
  GetTypeSummaryItem,
  GetTypeSummaryOutput,
  PostRecordsInput,
  PostRecordsOutput,
  SettleRecordsInput,
  SettleRecordsOutput,
  UpsertRecordInput,
} from './record.interface';
import {
  RPC_GET_METHOD_SUMMARY,
  type GetMethodSummaryRpc,
  type GetMethodSummaryRpcRow,
} from './rpc/getMethodSummary.interface';
import { RPC_GET_MONTH_SUM, type GetMonthSumRpc } from './rpc/getMonthSum.interface';
import {
  RPC_GET_PAIRED_RECORD_LIST,
  type GetPairedRecordListRpc,
  type GetPairedRecordListRpcRow,
} from './rpc/getPairedRecordList.interface';
import {
  RPC_GET_PAY_AND_INCOME_LIST,
  type GetPayAndIncomeListRpc,
  type GetPayAndIncomeListRpcRow,
} from './rpc/getPayAndIncomeList.interface';
import {
  RPC_GET_RECORD_LIST,
  type GetRecordListRpc,
  type GetRecordListRpcRow,
} from './rpc/getRecordList.interface';
import {
  RPC_GET_SUMMARIZED_RECORD_LIST,
  type GetSummarizedRecordListRpc,
  type GetSummarizedRecordListRpcRow,
} from './rpc/getSummarizedRecordList.interface';
import {
  RPC_GET_TYPE_SUMMARY,
  type GetTypeSummaryRpc,
  type GetTypeSummaryRpcRow,
} from './rpc/getTypeSummary.interface';
import { RPC_POST_RECORDS, type PostRecordsRpc } from './rpc/postRecords.interface';

export const getRecordList = async (
  { isDemoLogin, userUid }: SupabaseApiAuthGet,
  { start, end }: GetRecordListInput
): Promise<GetRecordListOutput> => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.GET_RECORD_LIST;

  const payload = { input_user_id: userUid, input_start_datetime: start, input_end_datetime: end };
  const { data, error } = await supabase.rpc<typeof RPC_GET_RECORD_LIST, GetRecordListRpc>(
    RPC_GET_RECORD_LIST,
    payload
  );
  if (error != null || data === null) {
    return { data: [], error: error, message: 'record 一覧' };
  }

  const camelizedData = camelizeKeys<{ data: GetRecordListRpcRow[] }>({ data });
  const outData = camelizedData.data.map((e) => {
    return { ...e, id: e.recordId };
  });
  return { data: outData, error: error, message: 'record 一覧' };
};

export const upsertRecord = async (
  { isDemoLogin, userUid, isPair, pairId }: SupabaseApiAuthUpsert,
  { id, datetime, isPay, methodId, isInstead, typeId, subTypeId, price, memo }: UpsertRecordInput
): Promise<UpsertOutput> => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

  if (id === null) {
    if (isPair && pairId == null) {
      return { data: null, error: 'isPair と pairID の関係性', message: 'method 挿入' };
    }

    // 挿入
    const { data, error } = await supabase.from('records').insert([
      {
        user_id: isPair && !isInstead ? null : userUid,
        pair_id: isPair ? pairId : null,
        datetime: datetime,
        is_pay: isPay,
        method_id: methodId,
        is_instead: isPair ? isInstead : null,
        is_settled: isPair && isInstead ? false : null,
        type_id: typeId,
        sub_type_id: subTypeId,
        price: price,
        memo: memo,
      },
    ]);
    return { data: data, error: error, message: 'record 挿入' };
  } else if (id) {
    // 更新
    const { data, error } = await supabase
      .from('records')
      .update({
        user_id: isPair && !isInstead ? null : userUid,
        pair_id: isPair ? pairId : null,
        datetime: datetime,
        is_pay: isPay,
        method_id: methodId,
        is_instead: isPair ? isInstead : null,
        is_settled: isPair && isInstead ? false : null,
        type_id: typeId,
        sub_type_id: subTypeId,
        price: price,
        memo: memo,
      })
      .eq('id', id);
    return { data: data, error: error, message: 'record 更新' };
  } else {
    return { data: null, error: '想定外の状況', message: 'record upsert 想定外の状況' };
  }
};

export const settleRecords = async (
  { isDemoLogin }: SupabaseApiAuth,
  { ids }: SettleRecordsInput
): Promise<SettleRecordsOutput> => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;
  if (ids.length === 0) return { data: null, error: 'no id', message: 'is_settled 更新' };

  const { data, error } = await supabase
    .from('records')
    .update({
      is_settled: true,
    })
    .in('id', ids);
  return { data: data, error: error, message: 'is_settled 更新' };
};

export const postRecords = async (
  { isDemoLogin, userUid }: SupabaseApiAuthGet,
  { yearMonth }: PostRecordsInput
): Promise<PostRecordsOutput> => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

  const payload = { input_user_id: userUid, input_year_month: yearMonth };
  const { data, error } = await supabase.rpc<typeof RPC_POST_RECORDS, PostRecordsRpc>(
    RPC_POST_RECORDS,
    payload
  );
  return { data: data, error: error, message: 'planned_record が未設定の record 登録' };
};

export const deleteRecord = async (
  { isDemoLogin }: SupabaseApiAuth,
  { id }: DeleteInput
): Promise<DeleteOutput> => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

  const { data, error } = await supabase.from('records').delete().eq('id', id);
  return { data: data, error: error, message: 'record 削除' };
};

export const getMonthSum = async (
  { isDemoLogin, userUid }: SupabaseApiAuthGet,
  { yearMonth }: GetMonthSumInput
): Promise<GetMonthSumOutput> => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.GET_MONTH_SUM(yearMonth);

  const payload = { input_user_id: userUid, input_year_month: yearMonth };
  const { data, error } = await supabase.rpc<typeof RPC_GET_MONTH_SUM, GetMonthSumRpc>(
    RPC_GET_MONTH_SUM,
    payload
  );

  if (error !== null || !Array.isArray(data) || data === null || data.length != 1) {
    return {
      data: { ['SELF']: 0, ['PAIR']: 0, ['BOTH']: 0 },
      error: error,
      message: 'month_sum 取得',
    };
  }
  return {
    data: {
      ['SELF']: data[0].self_sum,
      ['PAIR']: data[0].pair_sum,
      ['BOTH']: data[0].both_sum,
    },
    error: error,
    message: 'month_sum 取得',
  };
};

export const getTypeSummary = async (
  { isDemoLogin, userUid }: SupabaseApiAuthGet,
  { isPay, isPair, isIncludeInstead, year, month }: GetTypeSummaryInput
): Promise<GetTypeSummaryOutput> => {
  if (isDemoLogin)
    return DEMO_DATA.SUPABASE.GET_TYPE_OR_METHOD_SUMMARY(
      isPay,
      true,
      isPair,
      isIncludeInstead,
      year,
      month
    );

  const payload = {
    input_user_id: userUid,
    input_is_pay: isPay,
    input_is_pair: isPair,
    input_is_include_instead: isIncludeInstead,
    input_year: year,
    input_month: month,
  };
  const { data, error } = await supabase.rpc<typeof RPC_GET_TYPE_SUMMARY, GetTypeSummaryRpc>(
    RPC_GET_TYPE_SUMMARY,
    payload
  );
  if (error !== null || data === null) {
    return { data: [], error: error, message: 'type summary 一覧' };
  }

  const groupedData: GetTypeSummaryItem[] = [];
  data.forEach((row, i) => {
    if (i == 0 || groupedData[groupedData.length - 1].typeId != row.type_id) {
      groupedData.push({ ...camelizeKeys<GetTypeSummaryRpcRow>(row), subTypes: [] });
    }
    groupedData[groupedData.length - 1].subTypes.push({
      subTypeId: row.sub_type_id,
      subTypeName: row.sub_type_name,
      subTypeSum: row.sub_type_sum,
    });
  });

  return {
    data: groupedData,
    error: null,
    message: 'type summary 一覧',
  };
};

export const getMethodSummary = async (
  { isDemoLogin, userUid }: SupabaseApiAuthGet,
  { isPay, isPair, isIncludeInstead, year, month }: GetMethodSummaryInput
): Promise<GetMethodSummaryOutput> => {
  if (isDemoLogin)
    return DEMO_DATA.SUPABASE.GET_TYPE_OR_METHOD_SUMMARY(
      isPay,
      false,
      isPair,
      isIncludeInstead,
      year,
      month
    );

  const payload = {
    input_user_id: userUid,
    input_is_pay: isPay,
    input_is_pair: isPair,
    input_is_include_instead: isIncludeInstead,
    input_year: year,
    input_month: month,
  };
  const { data, error } = await supabase.rpc<typeof RPC_GET_METHOD_SUMMARY, GetMethodSummaryRpc>(
    RPC_GET_METHOD_SUMMARY,
    payload
  );
  if (error !== null || data === null) {
    return { data: [], error: error, message: 'method summary 一覧' };
  }

  const camelizedData = camelizeKeys<{ data: GetMethodSummaryRpcRow[] }>({ data });
  return {
    data: camelizedData.data,
    error: null,
    message: ' method summary 一覧',
  };
};

export const getSummarizedRecordList = async (
  { isDemoLogin, userUid }: SupabaseApiAuthGet,
  {
    isPay,
    isType,
    isPair,
    isIncludeInstead,
    yearMonth,
    id,
    subtypeId,
  }: GetSummarizedRecordListInput
): Promise<GetSummarizedRecordListOutput> => {
  if (isDemoLogin)
    return DEMO_DATA.SUPABASE.GET_SUMMARIZED_RECORD_LIST(
      isPay,
      isType,
      isPair,
      isIncludeInstead,
      yearMonth,
      id,
      subtypeId
    );

  const payload = {
    input_user_id: userUid,
    input_is_pay: isPay,
    input_is_type: isType,
    input_is_pair: isPair,
    input_is_include_instead: isIncludeInstead,
    input_year_month: yearMonth,
    input_id: id,
    input_sub_type_id: subtypeId,
  };
  const { data, error } = await supabase.rpc<
    typeof RPC_GET_SUMMARIZED_RECORD_LIST,
    GetSummarizedRecordListRpc
  >(RPC_GET_SUMMARIZED_RECORD_LIST, payload);
  if (error !== null || !Array.isArray(data)) {
    return { data: [], error: error, message: 'summarized_record 一覧' };
  }

  const camelizedData = camelizeKeys<{ data: GetSummarizedRecordListRpcRow[] }>({ data });
  const outData = camelizedData.data.map((e) => {
    // TODO 不要なrecord_idも渡してしまう
    return { ...e, id: e.recordId };
  });

  return { data: outData, error: error, message: 'summarized_record 一覧' };
};

export const getPairedRecordList = async (
  { isDemoLogin, userUid }: SupabaseApiAuthGet,
  { yearMonth }: GetPairedRecordListInput
): Promise<GetPairedRecordListOutput> => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.GET_PAIRED_RECORD_LIST(yearMonth);

  const payload = {
    input_user_id: userUid,
    input_year_month: yearMonth,
  };
  const { data, error } = await supabase.rpc<
    typeof RPC_GET_PAIRED_RECORD_LIST,
    GetPairedRecordListRpc
  >(RPC_GET_PAIRED_RECORD_LIST, payload);
  if (error !== null || !Array.isArray(data)) {
    return { data: [], error: error, message: 'paired_record 一覧' };
  }

  const camelizedData = camelizeKeys<{ data: GetPairedRecordListRpcRow[] }>({ data });
  return { data: camelizedData.data, error: error, message: 'paired_record 一覧' };
};

export const getPayAndIncomeList = async (
  { isDemoLogin, userUid }: SupabaseApiAuthGet,
  { year, isPair, isIncludeInstead }: GetPayAndIncomeListInput
): Promise<GetPayAndIncomeListOutput> => {
  if (isDemoLogin)
    return DEMO_DATA.SUPABASE.GET_PAY_AND_INCOME_LIST(year, isPair, isIncludeInstead);

  const payload = {
    input_user_id: userUid,
    input_year: year,
    input_is_pair: isPair,
    input_is_include_instead: isIncludeInstead,
  };
  const { data, error } = await supabase.rpc<
    typeof RPC_GET_PAY_AND_INCOME_LIST,
    GetPayAndIncomeListRpc
  >(RPC_GET_PAY_AND_INCOME_LIST, payload);
  if (error !== null || data === null) {
    return { data: [], error: error, message: 'pay_and_income 一覧' };
  }

  const camelizedData = camelizeKeys<{ data: GetPayAndIncomeListRpcRow[] }>({ data });
  return { data: camelizedData.data, error: error, message: 'pay_and_income 一覧' };
};
