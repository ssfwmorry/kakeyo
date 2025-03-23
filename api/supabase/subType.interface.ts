import type { Id } from '@/utils/types/common';

export interface UpsertSubTypeInput {
  id: Id | null;
  typeId: Id;
  name: string;
}
