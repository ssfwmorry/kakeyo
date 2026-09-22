import { z } from 'zod';
import { priceSchema } from '@/lib/shared/domain/price';

// 精算（summary/settlement 画面）フォームのスキーマ。
// 精算 record は type を持たず method（送金方法）と金額・日付・支払/受取のみ。
// user_id / pair_id は session 由来（クライアント値を信用しない）。

export const settlementCreateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日付を選択してください'),
  // 支払（自分→相手）なら true、受取なら false。
  isPay: z.stringbool(),
  methodId: z.coerce
    .number({ error: '方法を選択してください' })
    .int()
    .positive(),
  price: priceSchema
});

// 一括精算。チェックした record の id 群（Conform 配列フィールド）。
export const settleRecordsSchema = z.object({
  ids: z
    .array(z.coerce.number().int().positive())
    .min(1, '精算対象を選択してください')
});

export type SettlementCreateInput = z.infer<typeof settlementCreateSchema>;
