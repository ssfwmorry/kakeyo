import { z } from 'zod';
import { entityIdSchema } from '@/lib/shared/domain/entityId';
import { priceSchema } from '@/lib/shared/domain/price';
import { bankLabels } from '../labels';

const { validation } = bankLabels;

// 口座残高（bank_balance）登録フォームの入力スキーマ。
// 可変行（口座を選び残高を入力する行を複数）で、行ごとに { bankId, price }。

// 1 行分。price は priceSchema（全角/カンマ正規化 + 非負整数）＋ 0 より大きいことを要求。
const balanceRowSchema = z.object({
  // デモの負 ID を許容する共有 entityIdSchema（0 のみ拒否）。
  bankId: entityIdSchema(validation.bankRequired),
  price: priceSchema.refine((n) => n > 0, {
    message: validation.priceMin
  })
});

// フォーム全体。rows は 1 件以上。同一 bankId の重複はフォームエラーにする。
export const bankBalanceFormSchema = z
  .object({
    rows: z.array(balanceRowSchema).min(1, validation.rowsMin)
  })
  .superRefine((value, ctx) => {
    const seen = new Set<number>();
    value.rows.forEach((row, index) => {
      if (seen.has(row.bankId)) {
        ctx.addIssue({
          code: 'custom',
          message: validation.duplicateBank,
          path: ['rows', index, 'bankId']
        });
        return;
      }
      seen.add(row.bankId);
    });
  });

export type BankBalanceFormValue = z.infer<typeof bankBalanceFormSchema>;
export type BankBalanceRow = z.infer<typeof balanceRowSchema>;
