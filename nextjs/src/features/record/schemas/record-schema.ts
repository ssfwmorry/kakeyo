import { z } from 'zod';
import { entityIdSchema } from '@/lib/shared/domain/entityId';
import { priceSchema } from '@/lib/shared/domain/price';

// note（記録入力）の record 登録・更新スキーマ（Conform + Zod）。
// 「1 フォーム = 1 スキーマ = 1 useForm」。userId / pairId は session 由来のため
// スキーマに含めない（クライアント値を信用しない）。金額は共有 priceSchema を組み込む
// （素の Number() 禁止・全角/カンマ正規化込み）。日付は YYYY-MM-DD 文字列で受ける。

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

// record upsert。id 空 = 新規、数値 = 更新。isPay / isInstead / isPair は hidden で送る。
export const recordUpsertSchema = z.object({
  // ID 群はデモの負 ID を許容する共有 entityIdSchema（0 のみ拒否）を使う。
  id: entityIdSchema().optional(),
  // YYYY-MM-DD（JST の暦日）。startOfDayJst で timestamptz へ変換する。
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日付を選択してください'),
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
export const recordDeleteSchema = z.object({
  id: entityIdSchema()
});

export type RecordUpsertInput = z.infer<typeof recordUpsertSchema>;
