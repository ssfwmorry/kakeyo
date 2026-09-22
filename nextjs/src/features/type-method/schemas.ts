import { z } from 'zod';
import { typeMethodLabels } from './labels';

// 設定 CRUD フォームの入力スキーマ（Conform + Zod）。
// 「1 フォーム = 1 スキーマ = 1 useForm」。userId / pairId は session 由来のため
// スキーマには含めない（クライアント値を信用しない）。

const { validation } = typeMethodLabels;

// カテゴリ upsert。id 空文字 = 新規、数値 = 更新。isPay / isPair は hidden で送る。
export const typeUpsertSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  name: z.string().min(1, validation.typeNameRequired).max(10),
  colorId: z.coerce
    .number({ error: validation.colorRequired })
    .int()
    .positive(),
  isPay: z.stringbool(),
  isPair: z.stringbool()
});

// サブカテゴリ upsert。親 type は必須。色は持たない。
export const subTypeUpsertSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  typeId: z.coerce.number().int().positive(),
  name: z.string().min(1, validation.subTypeNameRequired).max(10)
});

// 方法 upsert。payMode を pay/income/both で受け、service で isPay(true/false/null) に写す。
export const methodUpsertSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  name: z.string().min(1, validation.methodNameRequired).max(10),
  colorId: z.coerce
    .number({ error: validation.colorRequired })
    .int()
    .positive(),
  payMode: z.enum(['pay', 'income', 'both']),
  isPair: z.stringbool()
});

// 削除（id のみ）。type / subType / method 共通。
export const deleteSchema = z.object({
  id: z.coerce.number().int().positive()
});

export type TypeUpsertInput = z.infer<typeof typeUpsertSchema>;
export type SubTypeUpsertInput = z.infer<typeof subTypeUpsertSchema>;
export type MethodUpsertInput = z.infer<typeof methodUpsertSchema>;
