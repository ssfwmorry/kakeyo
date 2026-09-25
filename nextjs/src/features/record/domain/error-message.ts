import { L } from '@/lib/shared/labels';
import { recordLabels } from '../labels';
import type { RecordError } from '../types';

// record サービスの失敗分類 → ユーザ向け文言。
// 旧 /note の Action と新デザインの入力フローが同じ変換を使うため、Action の外に置く。

export function recordErrorMessage(error: RecordError): string | undefined {
  switch (error) {
    case 'foreignKey':
      return L.error.hasRelatedData;
    case 'pairRequired':
      return recordLabels.error.pairRequired;
    case 'sameMonthOnly':
      return recordLabels.error.sameMonthOnly;
    case 'notInScope':
      return L.error.notFound;
    case 'noTarget':
      return recordLabels.error.noTarget;
    default:
      return undefined;
  }
}
