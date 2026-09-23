import { z } from 'zod';
import { entityIdSchema } from '@/lib/shared/domain/entityId';
import { priceSchema } from '@/lib/shared/domain/price';
import { plannedRecordLabels } from './labels';

// note（定期編集）の planned_record 登録・更新スキーマ。
// record-schema との違いは「日付ではなく day_classification_id を持つ」こと。

// メモは空文字を null に寄せる（任意項目）。
const optionalMemo = z
  .string()
  .max(1000)
  .optional()
  .transform((value) => {
    if (value === undefined || value.trim() === '') {
      return null;
    }
    return value;
  });

// planned_record upsert。id 空 = 新規、数値 = 更新。isPay / isInstead / isPair は
// hidden で送る（isPair の正は Server Action が Cookie から読む）。
export const plannedRecordUpsertSchema = z.object({
  id: entityIdSchema().optional(),
  dayClassificationId: entityIdSchema(plannedRecordLabels.error.dayRequired),
  isPay: z.stringbool(),
  isPair: z.stringbool(),
  isInstead: z.stringbool(),
  methodId: entityIdSchema('方法を選択してください'),
  typeId: entityIdSchema('カテゴリを選択してください'),
  subTypeId: entityIdSchema().optional(),
  price: priceSchema,
  memo: optionalMemo
});

// 削除（id のみ）。
export const plannedRecordDeleteSchema = z.object({
  id: entityIdSchema()
});

export type PlannedRecordUpsertInput = z.infer<
  typeof plannedRecordUpsertSchema
>;
