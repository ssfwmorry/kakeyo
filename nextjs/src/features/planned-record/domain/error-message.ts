import { L } from '@/lib/shared/labels';
import { plannedRecordLabels } from '../labels';
import type { PlannedRecordError } from '../types';

// service の失敗分類 → ユーザ向け文言。
export function plannedRecordErrorMessage(
  error: PlannedRecordError
): string | undefined {
  switch (error) {
    case 'foreignKey':
      return L.error.hasRelatedData;
    case 'pairRequired':
      return plannedRecordLabels.error.pairRequired;
    case 'notInScope':
      return L.error.notFound;
    default:
      return undefined;
  }
}
