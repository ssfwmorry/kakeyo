import { z } from 'zod';
import { entityIdSchema } from '@/lib/shared/domain/entityId';
import { reminderRuleSchema } from './domain/reminder-condition';
import { planReminderLabels } from './labels';

// plan / planType / reminder の各フォームの入力スキーマ。

const { validation } = planReminderLabels;

// Conform（parseWithZod）は空文字フィールドを undefined に剥がしてから schema に渡す。
// そのため「空を null に写す」任意項目は .nullable() だけでは undefined で落ちる。
// 必ず .optional() を挟み、undefined / 空文字の両方を null へ寄せる。
const optionalTrimmedText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v === undefined || v === '' ? null : v));

export const planTypeUpsertSchema = z.object({
  id: entityIdSchema().optional(),
  name: z
    .string()
    .trim()
    .min(1, validation.planTypeNameRequired)
    .max(10, validation.planTypeNameMax),
  colorId: z.coerce
    .number({ message: validation.colorRequired })
    .int()
    .positive(validation.colorRequired),
  isPair: z.stringbool()
});

// 予定 upsert。単日/期間。start <= end を superRefine で検証。
export const planUpsertSchema = z
  .object({
    id: entityIdSchema().optional(),
    name: z
      .string()
      .trim()
      .min(1, validation.planNameRequired)
      .max(30, validation.planNameMax),
    startDate: z.string().min(1, validation.dateRequired),
    endDate: z.string().min(1, validation.dateRequired),
    planTypeId: entityIdSchema(validation.planTypeRequired),
    memo: optionalTrimmedText,
    isPair: z.stringbool()
  })
  .superRefine((value, ctx) => {
    if (value.startDate > value.endDate) {
      ctx.addIssue({
        code: 'custom',
        message: validation.periodInvalid,
        path: ['endDate']
      });
    }
  });

// リマインダー insert。繰り返し条件は hidden の JSON 文字列 1 本で受け、
// パースしてから discriminatedUnion で検証する（kind ごとの必須項目は型が保証する）。
export const reminderInsertSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, validation.reminderNameRequired)
    .max(10, validation.reminderNameMax),
  colorId: z.coerce
    .number({ message: validation.colorRequired })
    .int()
    .positive(validation.colorRequired),
  date: z.string().min(1, validation.dateRequired),
  memo: optionalTrimmedText,
  rule: z
    .string()
    .min(1, validation.conditionInvalid)
    .transform((value, ctx) => {
      try {
        return JSON.parse(value) as unknown;
      } catch {
        ctx.addIssue({ code: 'custom', message: validation.conditionInvalid });
        return z.NEVER;
      }
    })
    .pipe(reminderRuleSchema)
});

// 削除（id のみ）。plan / planType / reminder 共通。
export const deleteSchema = z.object({
  id: entityIdSchema()
});

export type PlanTypeUpsertInput = z.infer<typeof planTypeUpsertSchema>;
export type PlanUpsertInput = z.infer<typeof planUpsertSchema>;
export type ReminderInsertInput = z.infer<typeof reminderInsertSchema>;
