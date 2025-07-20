import type { ColorString, Id } from '@/utils/types/common';
import type { ShortCut } from '@/utils/types/model';
import type { PostgrestError } from '@supabase/supabase-js';
import type { ApiOutput } from './common.interface';

export type GetShortCutListItem = ShortCut & {
  methods: {
    id: Id;
    name: string;
    colorClassifications: {
      id: Id;
      name: ColorString;
    };
  };
  types: {
    id: Id;
    name: string;
    colorClassifications: {
      id: Id;
      name: ColorString;
    };
  };
  subTypes: {
    id: Id;
    name: string;
  } | null;
};
export interface GetShortCutListOutput extends ApiOutput<GetShortCutListItem[], PostgrestError> {}
