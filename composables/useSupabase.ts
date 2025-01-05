import supabase from '@/composables/supabase';
import { DEMO_DATA } from '@/constants';
import type {
  DateRange,
  GetMethodSummaryRpc,
  GetRecordListRpc,
  GetTypeSummaryOutput,
  GetTypeSummaryRpc,
  Id,
  SupabaseApiAuth,
  SupabaseApiAuthGet,
  SupabaseApiAuthUpsert,
  UpsertRecordInput,
} from '@/types/common';

const supabaseApi = {
  async getPairId({ uid }: any) {
    const { data, error } = await supabase
      .from('pairs')
      .select('id')
      .or(`user1_id.eq.${uid},user2_id.eq.${uid}`);
    if (error != null) {
      return { data: data, error: error, message: 'pair_id 取得' };
    } else if (data.length > 1) {
      return { data: null, error: 'DBの状態がおかしい', message: 'pair_id 取得' };
    } else if (data.length == 0) {
      // pair 未登録
      return { data: null, error: null };
    }
    return { data: data[0].id as Id, error: null };
  },
  async getTypeList({ isDemoLogin, userUid }: any) {
    if (isDemoLogin) return DEMO_DATA.SUPABASE.GET_TYPE_LIST;

    const payload = { input_user_id: userUid };
    const { data, error } = await supabase.rpc('get_type_list', payload);
    if (error != null) {
      return { data: data, error: error, message: 'type 一覧' };
    }

    const incomeSelf = data.filter((e: any) => !e.is_pair && !e.is_pay);
    const incomePair = data.filter((e: any) => e.is_pair && !e.is_pay);
    const paySelf = data.filter((e: any) => !e.is_pair && e.is_pay);
    const payPair = data.filter((e: any) => e.is_pair && e.is_pay);
    const getGroupedType = (data: any) => {
      let groupedData: any[] = [];
      (data ?? []).forEach((row: any, i: number) => {
        if (i == 0 || groupedData[groupedData.length - 1].type_id != row.type_id) {
          row['sub_types'] = [];
          groupedData.push(row);
        }
        if (row.sub_type_id !== null) {
          groupedData[groupedData.length - 1].sub_types.push({
            sub_type_id: row.sub_type_id,
            sub_type_name: row.sub_type_name,
            sub_type_sort: row.sub_type_sort,
          });
        }
      });
      return groupedData;
    };

    return {
      data: {
        income: {
          self: getGroupedType(incomeSelf),
          pair: getGroupedType(incomePair),
        },
        pay: {
          self: getGroupedType(paySelf),
          pair: getGroupedType(payPair),
        },
      },
      error: error,
      message: 'type 取得',
    };
  },
  async upsertType({ rootGetters, commit }: any, { id, name, isPay, colorId }: any) {
    if (rootGetters.isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

    if (id === null) {
      // TODO よりよい状況バリデーションチェック, 他の API も
      if (rootGetters.isPair && rootGetters.pairId == null) {
        return { data: null, error: 'isPair と pairID の関係性', message: 'type 挿入' };
      }

      // 挿入
      const { data, error } = await supabase.from('types').insert([
        {
          name: name,
          user_id: rootGetters.isPair ? null : rootGetters.userUID,
          pair_id: rootGetters.isPair ? rootGetters.pairId : null,
          is_pay: isPay,
          color_classification_id: colorId,
        },
      ]);
      return { data: data, error: error, message: 'type 挿入' };
    } else if (id) {
      // 更新
      const { data, error } = await supabase
        .from('types')
        .update({
          name: name,
          color_classification_id: colorId,
        })
        .eq('id', id);
      return { data: data, error: error, message: 'type 更新' };
    } else {
      return { data: null, error: true, message: 'type upsert 想定外の状況' };
    }
  },
  async deleteType({ rootGetters, commit }: any, { id }: any) {
    if (rootGetters.isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

    const { data, error } = await supabase.from('types').delete().eq('id', id);
    return { data: data, error: error, message: 'type 削除' };
  },
  async swapType({ rootGetters, commit }: any, { prevId, nextId }: any) {
    if (rootGetters.isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

    const { data, error } = await supabase.rpc('swap_type', { id1: prevId, id2: nextId });
    return { data: data, error: error, message: 'type 入替' };
  },
  async upsertSubType({ rootGetters, commit }: any, { id, typeId, name }: any) {
    if (rootGetters.isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

    if (id === null) {
      // 挿入
      const { data, error } = await supabase.from('sub_types').insert([
        {
          type_id: typeId,
          name: name,
        },
      ]);
      return { data: data, error: error, message: 'sub_types 挿入' };
    } else if (id) {
      // 更新
      const { data, error } = await supabase.from('sub_types').update({ name: name }).eq('id', id);
      return { data: data, error: error, message: 'sub_types 更新' };
    } else {
      return { data: null, error: true, message: 'sub_types upsert 想定外の状況' };
    }
  },
  async deleteSubType({ rootGetters, commit }: any, { id }: any) {
    if (rootGetters.isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

    const { data, error } = await supabase.from('sub_types').delete().eq('id', id);
    return { data: data, error: error, message: 'sub_type 削除' };
  },
  async swapSubType({ rootGetters, commit }: any, { prevId, nextId }: any) {
    if (rootGetters.isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

    const { data, error } = await supabase.rpc('swap_sub_type', { id1: prevId, id2: nextId });
    return { data: data, error: error, message: 'sub_type 入替' };
  },
  async getMethodList({ isDemoLogin, userUid }: any) {
    if (isDemoLogin) return DEMO_DATA.SUPABASE.GET_METHOD_LIST;

    const payload = { input_user_id: userUid };
    const { data, error } = await supabase.rpc('get_method_list', payload);
    if (error != null) {
      return { data: data, error: error, message: 'method 一覧' };
    }

    return {
      data: {
        income: {
          self: data.filter((e: any) => !e.is_pair && !e.is_pay),
          pair: data.filter((e: any) => e.is_pair && !e.is_pay),
        },
        pay: {
          self: data.filter((e: any) => !e.is_pair && e.is_pay),
          pair: data.filter((e: any) => e.is_pair && e.is_pay),
        },
      },
      error: error,
      message: 'method 一覧',
    };
  },
  async upsertMethod({ rootGetters, commit }: any, { id, name, isPay, colorId }: any) {
    if (rootGetters.isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

    if (id === null) {
      if (rootGetters.isPair && rootGetters.pairId == null) {
        return { data: null, error: 'isPair と pairID の関係性', message: 'method 挿入' };
      }

      // 挿入
      const { data, error } = await supabase.from('methods').insert([
        {
          name: name,
          user_id: rootGetters.isPair ? null : rootGetters.userUID,
          pair_id: rootGetters.isPair ? rootGetters.pairId : null,
          is_pay: isPay,
          color_classification_id: colorId,
        },
      ]);
      return { data: data, error: error, message: 'method 挿入' };
    } else if (id) {
      // 更新
      const { data, error } = await supabase
        .from('methods')
        .update({
          name: name,
          color_classification_id: colorId,
        })
        .eq('id', id);
      return { data: data, error: error, message: 'method 更新' };
    } else {
      return { data: null, error: true, message: 'method upsert 想定外の状況' };
    }
  },
  async deleteMethod({ rootGetters, commit }: any, { id }: any) {
    if (rootGetters.isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

    const { data, error } = await supabase.from('methods').delete().eq('id', id);
    return { data: data, error: error, message: 'method 削除' };
  },
  async swapMethod({ rootGetters, commit }: any, { prevId, nextId }: any) {
    if (rootGetters.isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

    const { data, error } = await supabase.rpc('swap_method', { id1: prevId, id2: nextId });
    return { data: data, error: error, message: 'type 入替' };
  },
  async getRecordList({ isDemoLogin, userUid }: SupabaseApiAuthGet, { start, end }: DateRange) {
    if (isDemoLogin) return DEMO_DATA.SUPABASE.GET_RECORD_LIST;

    // prettier-ignore
    const payload = {input_user_id: userUid, input_start_datetime: start, input_end_datetime: end};
    const { data, error } = await supabase.rpc('get_record_list', payload);
    if (error != null) {
      return { data: data, error: error, message: 'record 一覧' };
    }

    return { data: data as GetRecordListRpc[], error: error, message: 'record 一覧' };
  },
  async upsertRecord(
    { isDemoLogin, userUid, isPair, pairId }: SupabaseApiAuthUpsert,
    { id, datetime, isPay, methodId, isInstead, typeId, subTypeId, price, memo }: UpsertRecordInput
  ) {
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
  },
  async settleRecord({ rootGetters, commit }: any, { id }: any) {
    if (rootGetters.isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;
    if (id === null) return { data: null, error: 'no id', message: 'is_settled 更新' };

    const { data, error } = await supabase
      .from('records')
      .update({
        is_settled: true,
      })
      .eq('id', id);
    return { data: data, error: error, message: 'is_settled 更新' };
  },

  async postRecords({ isDemoLogin, userUid }: SupabaseApiAuthGet, { yearMonth }: any) {
    if (isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

    const payload = { input_user_id: userUid, input_year_month: yearMonth };
    const { data, error } = await supabase.rpc('post_records', payload);
    return { data: data, error: error, message: 'planned_record が未設定の record 登録' };
  },
  async deleteRecord({ isDemoLogin }: SupabaseApiAuth, id: Id) {
    if (isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

    const { data, error } = await supabase.from('records').delete().eq('id', id);
    return { data: data, error: error, message: 'record 削除' };
  },
  async getPlannedRecordList({ rootGetters, commit }: any) {
    if (rootGetters.isDemoLogin) return DEMO_DATA.SUPABASE.GET_PLANNED_RECORD_LIST;

    const payload = { input_user_id: rootGetters.userUID };
    const { data, error } = await supabase.rpc('get_planned_record_list', payload);
    if (error != null) {
      return { data: data, error: error, message: 'planned_record 一覧' };
    }

    return {
      data: {
        self: data.filter((e: any) => !e.is_pair),
        pair: data.filter((e: any) => e.is_pair),
      },
      error: error,
      message: 'planned_record 一覧',
    };
  },
  async upsertPlannedRecord(
    { rootGetters, commit }: any,
    { id, dayClassificationId, isPay, methodId, isInstead, typeId, subTypeId, price, memo }: any
  ) {
    if (rootGetters.isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

    if (id === null) {
      if (rootGetters.isPair && rootGetters.pairId == null) {
        return { data: null, error: 'isPair と pairID の関係性', message: 'method 挿入' };
      }

      // 挿入
      const { data, error } = await supabase.from('planned_records').insert([
        {
          user_id: rootGetters.isPair && !isInstead ? null : rootGetters.userUID,
          pair_id: rootGetters.isPair ? rootGetters.pairId : null,
          day_classification_id: dayClassificationId,
          is_pay: isPay,
          method_id: methodId,
          type_id: typeId,
          sub_type_id: subTypeId,
          price: price,
          memo: memo,
        },
      ]);
      return { data: data, error: error, message: 'planned_record 挿入' };
    } else if (id) {
      // 更新
      const { data, error } = await supabase
        .from('planned_records')
        .update({
          user_id: rootGetters.isPair && !isInstead ? null : rootGetters.userUID,
          pair_id: rootGetters.isPair ? rootGetters.pairId : null,
          day_classification_id: dayClassificationId,
          is_pay: isPay,
          method_id: methodId,
          type_id: typeId,
          sub_type_id: subTypeId,
          price: price,
          memo: memo,
        })
        .eq('id', id);
      return { data: data, error: error, message: 'planned_record 更新' };
    } else {
      return { data: null, error: true, message: 'planned_record upsert 想定外の状況' };
    }
  },
  async deletePlannedRecord({ rootGetters, commit }: any, { id }: any) {
    if (rootGetters.isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

    const { data, error } = await supabase.from('planned_records').delete().eq('id', id);
    return { data: data, error: error, message: 'planned_record 削除' };
  },
  async swapPlannedRecord({ rootGetters, commit }: any, { prevId, nextId }: any) {
    if (rootGetters.isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

    const { data, error } = await supabase.rpc('swap_planned_record', { id1: prevId, id2: nextId });
    return { data: data, error: error, message: 'planned_record 入替' };
  },
  async getPlanList({ isDemoLogin, userUid }: SupabaseApiAuthGet, { start, end }: DateRange) {
    if (isDemoLogin) return DEMO_DATA.SUPABASE.GET_PLAN_LIST;

    // prettier-ignore
    const payload = {input_user_id: userUid, input_start_date: start, input_end_date: end};
    const { data, error } = await supabase.rpc('get_plan_list', payload);
    if (error != null) {
      return { data: data, error: error, message: 'plan 一覧' };
    }

    return { data: data, error: error, message: 'plan 取得' };
  },
  async upsertPlan(
    { isDemoLogin, userUid, isPair, pairId }: SupabaseApiAuthUpsert,
    { id, startDate, endDate, planTypeId, name, memo }: any
  ) {
    if (isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

    if (id === null) {
      if (isPair && pairId == null) {
        return { data: null, error: 'isPair と pairID の関係性', message: 'method 挿入' };
      }

      // 挿入
      const { data, error } = await supabase.from('plans').insert([
        {
          user_id: isPair ? null : userUid,
          pair_id: isPair ? pairId : null,
          start_date: startDate,
          end_date: endDate,
          plan_type_id: planTypeId,
          name: name,
          memo: memo,
        },
      ]);
      return { data: data, error: error, message: 'plan 挿入' };
    } else if (id) {
      // 更新
      const { data, error } = await supabase
        .from('plans')
        .update({
          pair_id: isPair ? pairId : null,
          start_date: startDate,
          end_date: endDate,
          plan_type_id: planTypeId,
          name: name,
          memo: memo,
        })
        .eq('id', id);
      return { data: data, error: error, message: 'plan 更新' };
    } else {
      return { data: null, error: true, message: 'plan upsert 想定外の状況' };
    }
  },
  async deletePlan({ isDemoLogin }: SupabaseApiAuth, id: Id) {
    if (isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

    const { data, error } = await supabase.from('plans').delete().eq('id', id);
    return { data: data, error: error, message: 'plan 削除' };
  },
  async getPlanTypeList({ isDemoLogin, userUid }: SupabaseApiAuthGet) {
    if (isDemoLogin) return DEMO_DATA.SUPABASE.GET_PLAN_TYPE_LIST;

    const payload = { input_user_id: userUid };
    const { data, error } = await supabase.rpc('get_plan_type_list', payload);
    if (error != null) {
      return { data: data, error: error, message: 'plan_type 一覧' };
    }

    return {
      data: {
        self: data.filter((e: any) => !e.is_pair),
        pair: data.filter((e: any) => e.is_pair),
      },
      error: error,
      message: 'plan_type 取得',
    };
  },
  async upsertPlanType({ rootGetters, commit }: any, { id, name, colorId }: any) {
    if (rootGetters.isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

    if (id === null) {
      // TODO よりよい状況バリデーションチェック
      if (rootGetters.isPair && rootGetters.pairId == null) {
        return { data: null, error: 'isPair と pairID の関係性', message: 'plan_type 挿入' };
      }
      // 挿入
      const { data, error } = await supabase.from('plan_types').insert([
        {
          name: name,
          user_id: rootGetters.isPair ? null : rootGetters.userUID,
          pair_id: rootGetters.isPair ? rootGetters.pairId : null,
          color_classification_id: colorId,
        },
      ]);
      return { data: data, error: error, message: 'plan_type 挿入' };
    } else if (id) {
      // 更新
      const { data, error } = await supabase
        .from('plan_types')
        .update({
          name: name,
          color_classification_id: colorId,
        })
        .eq('id', id);
      return { data: data, error: error, message: 'plan_type 更新' };
    } else {
      return { data: null, error: true, message: 'plan_type upsert 想定外の状況' };
    }
  },
  async deletePlanType({ rootGetters, commit }: any, { id }: any) {
    if (rootGetters.isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

    const { data, error } = await supabase.from('plan_types').delete().eq('id', id);
    return { data: data, error: error, message: 'plan_type 削除' };
  },
  async swapPlanType({ rootGetters, commit }: any, { prevId, nextId }: any) {
    if (rootGetters.isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

    const { data, error } = await supabase.rpc('swap_plan_type', { id1: prevId, id2: nextId });
    return { data: data, error: error, message: 'plan_type 入替' };
  },
  async getMemoList({ isDemoLogin, userUid, pairId }: SupabaseApiAuthGet & { pairId: number }) {
    if (isDemoLogin) return DEMO_DATA.SUPABASE.GET_MEMO_LIST;

    const wherePairId = pairId ? `,pair_id.eq.${pairId}` : '';
    const { data, error } = await supabase
      .from('memos')
      .select('id, memo, pair_id')
      .or(`user_id.eq.${userUid}${wherePairId}`);
    return { data: data, error: error, message: 'memos 取得' };
  },
  async insertMemo(
    { isDemoLogin, userUid, isPair, pairId }: SupabaseApiAuthUpsert,
    { memo, isPair: isPairMemo }: any
  ) {
    if (isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

    const { data, error } = await supabase.from('memos').insert([
      {
        user_id: isPairMemo ? null : userUid,
        pair_id: isPairMemo ? pairId : null,
        memo: memo,
      },
    ]);
    return { data: data, error: error, message: 'memo 挿入' };
  },
  async deleteMemo({ isDemoLogin }: SupabaseApiAuth, { id }: any) {
    if (isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

    const { data, error } = await supabase.from('memos').delete().eq('id', id);
    return { data: data, error: error, message: 'memo 削除' };
  },
  async getMonthSum({ isDemoLogin, userUid }: SupabaseApiAuthGet, { yearMonth }: any) {
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
  },
  async getTypeSummary(
    { isDemoLogin, userUid }: SupabaseApiAuthGet,
    { isPay, isPair, isIncludeInstead, year, month }: any
  ) {
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
  },
  async getMethodSummary(
    { isDemoLogin, userUid }: SupabaseApiAuthGet,
    { isPay, isPair, isIncludeInstead, year, month }: any
  ) {
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
  },
  async getSummariedRecordList(
    { rootGetters, commit }: any,
    { isPay, isType, isPair, isIncludeInstead, yearMonth, id, subtypeId }: any
  ) {
    // prettier-ignore
    if (rootGetters.isDemoLogin) return DEMO_DATA.SUPABASE.GET_SUMMARIED_RECORD_LIST(isPay, isType, isPair, isIncludeInstead, yearMonth, id, subtypeId);

    const payload = {
      input_user_id: rootGetters.userUID,
      input_is_pay: isPay,
      input_is_type: isType,
      input_is_pair: isPair,
      input_is_include_instead: isIncludeInstead,
      input_year_month: yearMonth,
      input_id: id,
      input_sub_type_id: subtypeId,
    };
    const { data, error } = await supabase.rpc('get_summaried_record_list', payload);
    if (error !== null || !Array.isArray(data)) {
      return { data: data, error: error, message: 'summaried_record 一覧' };
    }

    return { data: data, error: error, message: 'summaried_record 一覧' };
  },
  async getPairedRecordList({ rootGetters, commit }: any, { yearMonth }: any) {
    if (rootGetters.isDemoLogin) return DEMO_DATA.SUPABASE.GET_PAIRED_RECORD_LIST(yearMonth);

    const payload = {
      input_user_id: rootGetters.userUID,
      input_year_month: yearMonth,
    };
    const { data, error } = await supabase.rpc('get_paired_record_list', payload);
    if (error !== null || !Array.isArray(data)) {
      return { data: data, error: error, message: 'paired_record 一覧' };
    }

    return { data: data, error: error, message: 'paired_record 一覧' };
  },
  async getPayAndIncomeList({ rootGetters, commit }: any, { year, isPair, isIncludeInstead }: any) {
    // prettier-ignore
    if (rootGetters.isDemoLogin) return DEMO_DATA.SUPABASE.GET_PAY_AND_INCOME_LIST(year, isPair, isIncludeInstead);

    // TODO よりよい状況バリデーションチェック
    if (rootGetters.isPair && rootGetters.pairId == null) {
      return { data: null, error: 'isPair と pairID の関係性', message: 'pay_and_income 一覧' };
    }

    const payload = {
      input_user_id: rootGetters.userUID,
      input_year: year,
      input_is_pair: isPair,
      input_is_include_instead: isIncludeInstead,
    };
    const { data, error } = await supabase.rpc('get_pay_and_income_list', payload);
    if (error !== null || !Array.isArray(data)) {
      return { data: data, error: error, message: 'pay_and_income 一覧' };
    }
    return { data: data, error: error, message: 'pay_and_income 一覧' };
  },
  async getDayList({ isDemoLogin }: any) {
    if (isDemoLogin) return DEMO_DATA.SUPABASE.GET_DAY_LIST;

    const { data, error } = await supabase.from('day_classifications').select('id, name, value');
    return { data: data, error: error, message: 'day_classifications 取得' };
  },
  async getColorList({ rootGetters, commit }: any) {
    if (rootGetters.isDemoLogin) return DEMO_DATA.SUPABASE.GET_COLOR_LIST;

    const { data, error } = await supabase.from('color_classifications').select('id, name');
    return { data: data, error: error, message: 'color_classifications 取得' };
  },
};

export const useSupabase = () => {
  return supabaseApi;
};
