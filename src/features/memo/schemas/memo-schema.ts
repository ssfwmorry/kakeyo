import { z } from 'zod';
import { entityIdSchema } from '@/lib/shared/domain/entityId';
import { memoLabels } from '../labels';

const { validation } = memoLabels;

// TODO（memo）フォームの入力スキーマ（Conform + Zod）。
// memo は最大 30 文字（DB の varchar(30) 制約）。
// isPair はチェックボックス由来。Conform/HTML の checkbox は「オン時のみ 'on' を
// 送出し、オフ時はフィールド自体が届かない」ため optional + 存在＝true とみなす。

// TODO 追加。
export const memoFormSchema = z.object({
  memo: z
    .string()
    .trim()
    .min(1, validation.memoRequired)
    .max(30, validation.memoMaxLength),
  // checkbox: 送られてくれば true（値は問わない）、無ければ false。
  isPair: z
    .union([z.literal('on'), z.string(), z.boolean()])
    .optional()
    .transform(
      (v) => v === true || v === 'on' || (typeof v === 'string' && v.length > 0)
    )
});

export type MemoFormValue = z.infer<typeof memoFormSchema>;

// TODO 削除。対象 id のみ。
export const memoDeleteSchema = z.object({
  id: entityIdSchema()
});
