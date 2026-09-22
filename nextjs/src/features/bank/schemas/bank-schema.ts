import { z } from 'zod';
import { entityIdSchema } from '@/lib/shared/domain/entityId';
import { bankLabels } from '../labels';

const { validation } = bankLabels;

// 口座（bank）フォームの入力スキーマ。
// 口座は「名前 + 色」だけを持つ個人専用データ。id は編集時のみ存在する。

// 口座の追加・編集。id 未指定なら新規、指定なら更新。
// Conform は空欄フィールドを送出しないため、編集時のみ id が届く。
// 空欄時は optional により undefined（＝新規）となる（type-method の id と同型）。
export const bankFormSchema = z.object({
  // デモの負 ID を許容する共有 entityIdSchema（0 のみ拒否）。colorId は実マスタ限定のため positive のまま。
  id: entityIdSchema().optional(),
  name: z
    .string()
    .trim()
    .min(1, validation.nameRequired)
    .max(30, validation.nameMaxLength),
  colorId: z.coerce
    .number({ message: validation.colorRequired })
    .int()
    .positive(validation.colorRequired)
});

export type BankFormValue = z.infer<typeof bankFormSchema>;

// 口座の削除。対象 id のみ。
export const bankDeleteSchema = z.object({
  id: entityIdSchema()
});
