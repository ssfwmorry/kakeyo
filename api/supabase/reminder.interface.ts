import type { PostgrestError } from '@supabase/supabase-js';
import type { Decamelized } from 'humps';
import type { ColorClassification, Condition, Pair, Reminder } from '~/utils/types/model';
import type { ApiOutput } from './common.interface';

export type DbCondition = Decamelized<ColorClassification>;

export type GetReminderListItem = Reminder & {
  colorClassification: ColorClassification;
  condition: Condition;
  pair: Pair;
};
export type GetReminderListOutputData = {
  self: GetReminderListItem[];
  pair: GetReminderListItem[];
  all: GetReminderListItem[];
};
export interface GetReminderListOutput
  extends ApiOutput<GetReminderListOutputData, PostgrestError> {}

export interface InsertReminderInput
  extends Omit<Reminder, 'id' | 'userId' | 'pairId' | 'conditionId'> {
  condition: Pick<Condition, 'month'>;
}
export interface InsertReminderOutput extends ApiOutput<null, PostgrestError> {}

export interface CheckReminderInput extends Reminder {
  condition: Pick<Condition, 'month'>;
}
