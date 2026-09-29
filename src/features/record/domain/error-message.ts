import { L } from '@/lib/shared/labels';
import { recordLabels } from '../labels';
import type { RecordError } from '../types';

// record サービスの失敗分類 → ユーザ向け文言。

export function recordErrorMessage(error: RecordError): string | undefined {
  switch (error) {
    case 'foreignKey':
      return L.error.hasRelatedData;
    case 'pairRequired':
      return recordLabels.error.pairRequired;
    case 'sameMonthOnly':
      return recordLabels.error.sameMonthOnly;
    case 'scopeLocked':
      return recordLabels.error.scopeLocked;
    case 'notInScope':
      return L.error.notFound;
    case 'noTarget':
      return recordLabels.error.noTarget;
    case 'methodRequired':
      return recordLabels.error.methodRequired;
    default:
      return undefined;
  }
}
