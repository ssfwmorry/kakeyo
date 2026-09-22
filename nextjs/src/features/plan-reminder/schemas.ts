import { z } from 'zod';
import { planReminderLabels } from './labels';
import {
  BaseType,
  ConditionType,
  ReminderType
} from './domain/reminder-condition';

// L5 各フォームの入力スキーマ（Conform + Zod）。「1 フォーム = 1 スキーマ = 1 useForm」。
// userId / pairId は session 由来のためスキーマに含めない（クライアント値を信用しない）。
// FormData は全て文字列で届くため id / 数値は coerce で数値化する。

const { validation } = planReminderLabels;

// ===== PLAN TYPE（予定カテゴリ）=====
export const planTypeUpsertSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
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

// ===== PLAN（予定）=====
// 単日/期間。start <= end を superRefine で検証。planTypeId は任意（null 許容）。
export const planUpsertSchema = z
  .object({
    id: z.coerce.number().int().positive().optional(),
    name: z
      .string()
      .trim()
      .min(1, validation.planNameRequired)
      .max(30, validation.planNameMax),
    startDate: z.string().min(1, validation.dateRequired),
    endDate: z.string().min(1, validation.dateRequired),
    // 空文字は「カテゴリなし」= null に写す。
    planTypeId: z
      .union([z.coerce.number().int().positive(), z.literal('')])
      .transform((v) => (v === '' ? null : v))
      .nullable(),
    memo: z
      .string()
      .trim()
      .transform((v) => (v === '' ? null : v))
      .nullable(),
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

// ===== REMINDER（定期的な予定）=====
// condition_type により month/monthDay/baseType の必須が変わるため superRefine で分岐。
export const reminderInsertSchema = z
  .object({
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
    memo: z
      .string()
      .trim()
      .transform((v) => (v === '' ? null : v))
      .nullable(),
    reminderType: z.coerce
      .number()
      .refine((v): v is ReminderType =>
        Object.values(ReminderType).includes(v as ReminderType)
      ),
    conditionType: z.coerce
      .number()
      .refine((v): v is ConditionType =>
        Object.values(ConditionType).includes(v as ConditionType)
      ),
    // 〜ヶ月後（conditionType=month のとき使う）。
    month: z
      .union([z.coerce.number().int().positive(), z.literal('')])
      .transform((v) => (v === '' ? null : v))
      .nullable(),
    baseType: z
      .union([z.coerce.number().int(), z.literal('')])
      .transform((v) => (v === '' ? null : v))
      .nullable(),
    // 月日 'MM-DD'（conditionType=monthDay のとき使う）。
    monthDay: z
      .string()
      .transform((v) => (v === '' ? null : v))
      .nullable()
  })
  .superRefine((value, ctx) => {
    if (value.conditionType === ConditionType.month) {
      if (value.month === null || value.baseType === null) {
        ctx.addIssue({
          code: 'custom',
          message: validation.conditionInvalid,
          path: ['month']
        });
      }
      return;
    }
    if (value.conditionType === ConditionType.monthDay) {
      if (value.monthDay === null) {
        ctx.addIssue({
          code: 'custom',
          message: validation.conditionInvalid,
          path: ['monthDay']
        });
      }
    }
  });

// 削除（id のみ）。plan / planType / reminder 共通。
export const deleteSchema = z.object({
  id: z.coerce.number().int().positive()
});

export { BaseType, ConditionType, ReminderType };
export type PlanTypeUpsertInput = z.infer<typeof planTypeUpsertSchema>;
export type PlanUpsertInput = z.infer<typeof planUpsertSchema>;
export type ReminderInsertInput = z.infer<typeof reminderInsertSchema>;
