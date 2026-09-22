import { z } from 'zod';
import { entityIdSchema } from '@/lib/shared/domain/entityId';
import { typeMethodLabels } from './labels';

// 設定 CRUD フォーム（カテゴリ / サブカテゴリ / 方法）の入力スキーマ。

const { validation } = typeMethodLabels;

// カテゴリ upsert。id 空文字 = 新規、数値 = 更新。isPay / isPair は hidden で送る。
export const typeUpsertSchema = z.object({
  // デモの負 ID を許容する共有 entityIdSchema（0 のみ拒否）。colorId は実マスタ限定のため positive のまま。
  id: entityIdSchema().optional(),
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
  id: entityIdSchema().optional(),
  typeId: entityIdSchema(),
  name: z.string().min(1, validation.subTypeNameRequired).max(10)
});

// 方法 upsert。payMode を pay/income/both で受け、service で isPay(true/false/null) に写す。
export const methodUpsertSchema = z.object({
  id: entityIdSchema().optional(),
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
  id: entityIdSchema()
});

export type TypeUpsertInput = z.infer<typeof typeUpsertSchema>;
export type SubTypeUpsertInput = z.infer<typeof subTypeUpsertSchema>;
export type MethodUpsertInput = z.infer<typeof methodUpsertSchema>;
