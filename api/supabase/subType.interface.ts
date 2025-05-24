import type { Id } from '@/utils/types/common';
import type { SubType } from '@/utils/types/model';
import type { Decamelized } from 'humps';

export type DbSubType = Decamelized<SubType>;
export interface UpsertSubTypeInput {
  id: Id | null;
  typeId: Id;
  name: string;
}
