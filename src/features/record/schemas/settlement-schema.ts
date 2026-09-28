import { z } from 'zod';
import { priceSchema } from '@/lib/shared/domain/price';

// 精算の完了（集計›精算）の入力。画面が 3 ステップの state から組み立てて送る。
// user_id / pair_id は session 由来（クライアント値を信用しない）。

const idSchema = z.number().int().positive();

export const settlementCompleteSchema = z
  .object({
    yearMonth: z.string().regex(/^\d{4}-\d{2}$/, '月が不正です'),
    // 精算済みにする立替の id 群。
    ids: z.array(idSchema).min(1, '精算対象を選択してください'),
    // 自分が相手へ渡すなら true、受け取るなら false。
    isPay: z.boolean(),
    // 精算 record の方法。精算額が 0 のときは記録を作らないので不要。
    methodId: idSchema.nullable(),
    price: priceSchema
  })
  .refine((value) => value.price === 0 || value.methodId !== null, {
    message: '精算方法を選択してください',
    path: ['methodId']
  });

export type SettlementCompleteInput = z.infer<typeof settlementCompleteSchema>;
