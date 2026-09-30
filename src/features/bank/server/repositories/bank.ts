import 'server-only';
import { and, asc, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/server/db/client';
import { isForeignKeyError } from '@/lib/server/db/errors';
import {
  bankBalances,
  banks,
  colorClassifications
} from '@/lib/server/db/schema';
import { buildOwnerScopeWhere } from '@/lib/shared/db/scope';
import type { SessionScope } from '@/lib/shared/types/auth';
import type { Id } from '@/lib/shared/types/id';

// bank は個人専用テーブル（pair で共有しない）ため buildOwnerScopeWhere を通す。
// update/delete は DB 直結で RLS をバイパスするため、更新/削除条件に userId を
// AND して他人の id での更新/削除（IDOR）を塞ぐ。

// 色分け表示のため color 名を含める。
export type BankListItem = {
  id: Id;
  name: string;
  colorClassificationId: Id;
  colorName: string;
  hasBalance: boolean;
};

// upsert の失敗種別（機械可読）。UI 文言はサービス/アクション層で付与する。
export type BankUpsertError = 'notFound';
// delete の失敗種別。foreignKey = 紐づく残高があり削除不可。
export type BankDeleteError = 'notFound' | 'foreignKey';

// 色マスタを include し id 昇順で安定させる。残高の有無は件数で引く（行は要らない）。
export async function getBankList(
  scope: SessionScope
): Promise<BankListItem[]> {
  const rows = await db
    .select({
      id: banks.id,
      name: banks.name,
      colorClassificationId: banks.colorClassificationId,
      colorName: colorClassifications.name,
      // 件数は要らず有無だけなので exists で引く。
      hasBalance: sql<boolean>`exists (select 1 from ${bankBalances} where ${bankBalances.bankId} = ${banks.id})`
    })
    .from(banks)
    .innerJoin(
      colorClassifications,
      eq(banks.colorClassificationId, colorClassifications.id)
    )
    .where(buildOwnerScopeWhere(banks.userId, scope))
    .orderBy(asc(banks.id));
  return rows;
}

export async function insertBank(
  scope: SessionScope,
  input: { name: string; colorClassificationId: Id }
): Promise<void> {
  await db.insert(banks).values({
    userId: scope.userUid,
    name: input.name,
    colorClassificationId: input.colorClassificationId
  });
}

// 0 件は「他人の id or 不存在」= notFound。
export async function updateBank(
  scope: SessionScope,
  input: { id: Id; name: string; colorClassificationId: Id }
): Promise<{ ok: true } | { ok: false; error: BankUpsertError }> {
  const updated = await db
    .update(banks)
    .set({
      name: input.name,
      colorClassificationId: input.colorClassificationId
    })
    .where(
      and(eq(banks.id, input.id), buildOwnerScopeWhere(banks.userId, scope))
    )
    .returning({ id: banks.id });
  if (updated.length === 0) {
    return { ok: false, error: 'notFound' };
  }
  return { ok: true };
}

// 0 件 = notFound。
// FK 制約違反（紐づく bank_balances あり）は foreignKey に分類する。
export async function deleteBank(
  scope: SessionScope,
  id: Id
): Promise<{ ok: true } | { ok: false; error: BankDeleteError }> {
  try {
    const deleted = await db
      .delete(banks)
      .where(and(eq(banks.id, id), buildOwnerScopeWhere(banks.userId, scope)))
      .returning({ id: banks.id });
    if (deleted.length === 0) {
      return { ok: false, error: 'notFound' };
    }
    return { ok: true };
  } catch (error) {
    if (isForeignKeyError(error)) {
      return { ok: false, error: 'foreignKey' };
    }
    throw error;
  }
}
