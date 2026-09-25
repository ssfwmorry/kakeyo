import { L } from '@/lib/shared/labels';
import { planReminderLabels } from '../labels';
import type { PlanReminderError } from '../types';

// plan / reminder サービスの失敗分類 → ユーザ向け文言。
// 旧 Action と新デザインの予定シートが同じ変換を使うため、Action の外に置く。

export function planReminderErrorMessage(
  error: PlanReminderError
): string | undefined {
  switch (error) {
    case 'foreignKey':
      return L.error.hasRelatedData;
    case 'pairRequired':
      return planReminderLabels.error.pairRequired;
    case 'notInScope':
      return L.error.notFound;
    default:
      return undefined;
  }
}
