import supabase from '@/composables/supabase';
import { DEMO_DATA } from '@/utils/constants';
import type {
  GetMethodSummaryRpc,
  GetPairedRecordListRpc,
  GetPayAndIncomeListRpc,
  GetRecordListRpc,
  GetTypeSummaryOutput,
  GetTypeSummaryRpc,
  SupabaseApiAuth,
  SupabaseApiAuthGet,
  SupabaseApiAuthUpsert,
  UpsertRecordInput,
} from '@/utils/types/api';
import type { DateRange, Id } from '@/utils/types/common';

export const getRecordList = async (
  { isDemoLogin, userUid }: SupabaseApiAuthGet,
  { start, end }: DateRange
) => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.GET_RECORD_LIST;

  // prettier-ignore
  const payload = {input_user_id: userUid, input_start_datetime: start, input_end_datetime: end};
  const { data, error } = await supabase.rpc('get_record_list', payload);
  if (error != null) {
    return { data: data, error: error, message: 'record 一覧' };
  }

  return { data: data as GetRecordListRpc[], error: error, message: 'record 一覧' };
};
export const upsertRecord = async (
  { isDemoLogin, userUid, isPair, pairId }: SupabaseApiAuthUpsert,
  { id, datetime, isPay, methodId, isInstead, typeId, subTypeId, price, memo }: UpsertRecordInput
) => {
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
export const settleRecords = async ({ isDemoLogin }: SupabaseApiAuth, ids: number[]) => {
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
  { yearMonth }: any
) => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

  const payload = { input_user_id: userUid, input_year_month: yearMonth };
  const { data, error } = await supabase.rpc('post_records', payload);
  return { data: data, error: error, message: 'planned_record が未設定の record 登録' };
};
export const deleteRecord = async ({ isDemoLogin }: SupabaseApiAuth, id: Id) => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

  const { data, error } = await supabase.from('records').delete().eq('id', id);
  return { data: data, error: error, message: 'record 削除' };
};

export const getMonthSum = async (
  { isDemoLogin, userUid }: SupabaseApiAuthGet,
  { yearMonth }: any
) => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.GET_MONTH_SUM(yearMonth);

  const payload = { input_user_id: userUid, input_year_month: yearMonth };
  const { data, error } = await supabase.rpc('get_month_sum', payload);
  if (error !== null || !Array.isArray(data)) {
    return { data: data, error: error, message: 'month_sum 取得' };
  } else if (data === null || data.length != 1) {
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
  { isPay, isPair, isIncludeInstead, year, month }: any
) => {
  // prettier-ignore
  if (isDemoLogin) return DEMO_DATA.SUPABASE.GET_TYPE_OR_METHOD_SUMMARY(isPay, true, isPair, isIncludeInstead, year, month);

  let outData, outError;
  const payload = {
    input_user_id: userUid,
    input_is_pay: isPay,
    input_is_pair: isPair,
    input_is_include_instead: isIncludeInstead,
    input_year: year,
    input_month: month,
  };
  const { data, error } = await supabase.rpc<any, { Returns: GetTypeSummaryRpc[] | null }>(
    'get_type_summary',
    payload
  );
  if (error === null) {
    let groupedData: GetTypeSummaryOutput[] = [];
    (data ?? []).forEach((typeObj: GetTypeSummaryRpc, i: number) => {
      if (i == 0 || groupedData[groupedData.length - 1].type_id != typeObj.type_id) {
        groupedData.push({ ...typeObj, sub_types: [] });
      }
      groupedData[groupedData.length - 1].sub_types.push({
        sub_type_id: typeObj.sub_type_id,
        sub_type_name: typeObj.sub_type_name,
        sub_type_sum: typeObj.sub_type_sum,
      });
    });
    [outData, outError] = [groupedData, null];
  } else {
    [outData, outError] = [data, error];
  }
  if (outError != null) {
    return { data: outData, error: outError, message: 'type summary 一覧' };
  }

  return {
    data: outData,
    error: null,
    message: 'type summary 一覧',
  };
};
export const getMethodSummary = async (
  { isDemoLogin, userUid }: SupabaseApiAuthGet,
  { isPay, isPair, isIncludeInstead, year, month }: any
) => {
  // prettier-ignore
  if (isDemoLogin) return DEMO_DATA.SUPABASE.GET_TYPE_OR_METHOD_SUMMARY(isPay, false, isPair, isIncludeInstead, year, month);

  let outData, outError;
  const payload = {
    input_user_id: userUid,
    input_is_pay: isPay,
    input_is_pair: isPair,
    input_is_include_instead: isIncludeInstead,
    input_year: year,
    input_month: month,
  };
  const { data, error } = await supabase.rpc<any, { Returns: GetMethodSummaryRpc[] | null }>(
    'get_method_summary',
    payload
  );
  [outData, outError] = [data, error];
  if (outError != null) {
    return { data: outData, error: outError, message: 'method summary 一覧' };
  }

  return {
    data: outData,
    error: null,
    message: ' method summary 一覧',
  };
};
export const getSummarizedRecordList = async (
  { isDemoLogin, userUid }: SupabaseApiAuthGet,
  { isPay, isType, isPair, isIncludeInstead, yearMonth, id, subtypeId }: any
) => {
  // prettier-ignore
  if (isDemoLogin) return DEMO_DATA.SUPABASE.GET_SUMMARIZED_RECORD_LIST(isPay, isType, isPair, isIncludeInstead, yearMonth, id, subtypeId);

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
  const { data, error } = await supabase.rpc('get_summarized_record_list', payload);
  if (error !== null || !Array.isArray(data)) {
    return { data: data, error: error, message: 'summarized_record 一覧' };
  }

  return { data: data, error: error, message: 'summarized_record 一覧' };
};
export const getPairedRecordList = async (
  { isDemoLogin, userUid }: SupabaseApiAuthGet,
  { yearMonth }: any
) => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.GET_PAIRED_RECORD_LIST(yearMonth);

  const payload = {
    input_user_id: userUid,
    input_year_month: yearMonth,
  };
  const { data, error } = await supabase.rpc<any, { Returns: GetPairedRecordListRpc[] | null }>(
    'get_paired_record_list',
    payload
  );
  if (error !== null || !Array.isArray(data)) {
    return { data: data, error: error, message: 'paired_record 一覧' };
  }

  return { data: data, error: error, message: 'paired_record 一覧' };
};
export const getPayAndIncomeList = async (
  { isDemoLogin, userUid }: SupabaseApiAuthGet,
  { year, isPair, isIncludeInstead }: any
) => {
  // prettier-ignore
  if (isDemoLogin)
    return DEMO_DATA.SUPABASE.GET_PAY_AND_INCOME_LIST(year, isPair, isIncludeInstead);

  // TODO よりよい状況バリデーションチェック
  // if (isPair && pairId == null) {
  //   return { data: null, error: 'isPair と pairID の関係性', message: 'pay_and_income 一覧' };
  // }

  const payload = {
    input_user_id: userUid,
    input_year: year,
    input_is_pair: isPair,
    input_is_include_instead: isIncludeInstead,
  };
  const { data, error } = await supabase.rpc<any, { Returns: GetPayAndIncomeListRpc[] | null }>(
    'get_pay_and_income_list',
    payload
  );
  if (error !== null || !Array.isArray(data)) {
    return { data: data, error: error, message: 'pay_and_income 一覧' };
  }
  return { data: data, error: error, message: 'pay_and_income 一覧' };
};
