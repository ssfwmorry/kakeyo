import dayjs from 'dayjs';
import { camelizeKeys } from 'humps';
import { DEMO_DATA } from '~/utils/constants';
import { BaseType, ConditionType, ReminderType } from '~/utils/types/model';
import {
  buildNoDataApiOutput,
  type DeleteInput,
  type SupabaseApiAuthUpsert,
  type SupabaseApiDemo,
  type SupabaseApiUserAndPair,
} from './common.interface';
import type {
  CheckReminderInput,
  DbCondition,
  GetReminderListItem,
  GetReminderListOutput,
  InsertReminderInput,
} from './reminder.interface';

export const getReminderList = async ({
  userUid,
  pairId,
}: SupabaseApiUserAndPair): Promise<GetReminderListOutput> => {
  // TODO: 型を調整する
  const { data, error } = await supabase
    .from('reminders')
    .select(
      `
      id,
      user_id,
      pair_id,
      name,
      reminder_type,
      condition_id,
      date,
      memo,
      color_classification_id,
      color_classification:color_classifications!inner(
        id,
        name
      ),
      condition:conditions!inner(
        id,
        condition_type,
        month,
        month_day,
        base_type
      )
    `
    )
    .or(`user_id.eq.${userUid},pair_id.eq.${pairId ?? 'dummy'}`);
  if (error != null || data === null) {
    return { error: error, message: 'reminder 一覧' };
  }

  // TODO: 型を調整する
  const camelizedData = camelizeKeys({ data }) as { data: GetReminderListItem[] };
  return {
    data: {
      self: camelizedData.data.filter((item) => item.pairId === null),
      pair: camelizedData.data.filter((item) => item.pairId !== null),
      all: camelizedData.data,
    },
    error: null,
    message: 'reminder 一覧',
  };
};

export const insertReminder = async (
  { isDemoLogin, userUid, isPair, pairId }: SupabaseApiAuthUpsert,
  { name, reminderType, condition, date, memo, colorClassificationId }: InsertReminderInput
) => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

  if (isPair && pairId == null) {
    throw new Error('isPair と pairID の関係性 reminder 挿入');
  }

  // insert condition
  const { error: error1, data: createdCondition } = await supabase
    .from('conditions')
    .insert([
      {
        condition_type: condition.conditionType,
        month: condition.month,
        month_day: condition.monthDay,
        base_type: condition.baseType,
      },
    ])
    .select()
    .single<DbCondition>();
  if (error1 != null) return buildNoDataApiOutput(error1, 'condition 挿入');

  // insert reminder
  const { error: error2 } = await supabase.from('reminders').insert([
    {
      user_id: isPair ? null : userUid,
      pair_id: isPair ? pairId : null,
      name,
      reminder_type: reminderType,
      condition_id: createdCondition.id,
      date,
      memo: memo,
      color_classification_id: colorClassificationId,
    },
  ]);
  return buildNoDataApiOutput(error2, 'reminder 挿入');
};

export const checkReminder = async (
  { isDemoLogin }: SupabaseApiDemo,
  input: CheckReminderInput
) => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

  let newDate: Date;
  if (input.condition.conditionType === ConditionType.monthDay) {
    // 月日指定
    const nextYear = dayjs().add(1, 'year');
    newDate = dayjs(`${nextYear}-${input.condition.monthDay}`).toDate();
  } else {
    // 〜ヶ月後指定
    const newDateBase = input.condition.baseType == BaseType.now ? dayjs() : dayjs(input.date);
    newDate = newDateBase.add(input.condition.month, 'month').toDate();
    if (input.reminderType === ReminderType.stock) {
      // planとして残す場合
      const { error } = await supabase.from('plans').insert([
        {
          user_id: input.userId,
          pair_id: input.pairId,
          start_date: input.date,
          end_date: input.date,
          plan_type_id: null,
          name: input.name,
          memo: input.memo,
          reminder_id: input.id,
        },
      ]);
      if (error != null) return buildNoDataApiOutput(error, 'plan 挿入');
    }
  }

  const { error } = await supabase.from('reminders').update({ date: newDate }).eq('id', input.id);
  return buildNoDataApiOutput(error, 'reminder チェック');
};

export const deleteReminder = async ({ isDemoLogin }: SupabaseApiDemo, { id }: DeleteInput) => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

  // TODO conditionsも削除する
  const { error: error1 } = await supabase
    .from('plans')
    .update({ reminder_id: null })
    .eq('reminder_id', id);
  if (error1 != null) return buildNoDataApiOutput(error1, 'plan.reminder_id 削除');

  const { error } = await supabase.from('reminders').delete().eq('id', id);
  return buildNoDataApiOutput(error, 'reminder 削除');
};
