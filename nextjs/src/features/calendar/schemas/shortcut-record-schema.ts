import { z } from 'zod';
import { entityIdSchema } from '@/lib/shared/domain/entityId';
import { priceSchema } from '@/lib/shared/domain/price';
import { RecordType } from '@/lib/shared/types/recordType';

// ショートカットからのワンタップ記録（calendar 統合レーン所有の Server Action 入力）。
// ShortcutList の onSelect が渡す ShortCutItem を hidden フィールドで受ける。
// user_id / pair_id / record_type の導出は record サービス（resolveRecordOwnership）に
// 委ねるため、ここでは isPair / isInstead を recordType から素直に組み立てる。
// datetime は当日（JST）を Action 側で startOfDayJst して付与する（クライアント時刻を信用しない）。
export const shortcutRecordSchema = z.object({
  isPay: z.stringbool(),
  methodId: entityIdSchema('方法が不正です'),
  typeId: entityIdSchema('カテゴリが不正です'),
  subTypeId: z
    .string()
    .optional()
    .transform((v) => {
      if (v === undefined || v === '' || v === '0') {
        return null;
      }
      const n = Number(v);
      return Number.isNaN(n) ? null : n;
    }),
  price: priceSchema,
  memo: z
    .string()
    .optional()
    .transform((v) => (v === undefined || v === '' ? null : v)),
  // record_type（0/5/10/15 のいずれか。ショートカットは 15=精算を持たない）。
  recordType: z.coerce
    .number()
    .refine(
      (v): v is (typeof RecordType)[keyof typeof RecordType] =>
        v === RecordType.self ||
        v === RecordType.instead ||
        v === RecordType.pair,
      'record_type が不正です'
    )
});

export type ShortcutRecordInput = z.infer<typeof shortcutRecordSchema>;
