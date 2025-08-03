import type { Decamelized } from 'humps';
import type { Id } from '~/utils/types/common';
import type { SubType } from '~/utils/types/model';

export type DbSubType = Decamelized<SubType>;
export interface UpsertSubTypeInput {
  id: Id | null;
  typeId: Id;
  name: string;
}
