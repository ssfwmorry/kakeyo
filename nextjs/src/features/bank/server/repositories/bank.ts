import 'server-only';
import { prisma } from '@/lib/server/db/client';
import { buildOwnerScopeWhere } from '@/lib/shared/db/scope';
import type { SessionScope } from '@/lib/shared/types/auth';
import type { Id } from '@/lib/shared/types/id';
import { Prisma } from '@/prisma/generated/client';

// bank は個人専用テーブル（pair で共有しない）ため buildOwnerScopeWhere を通す。
// update/delete は updateMany/deleteMany の where に userId を AND して IDOR を塞ぐ
// （旧 Nuxt の .eq('id') 単独は Prisma が RLS をバイパスするため他人の id で更新/削除できた）。

// Postgres の外部キー制約違反コード（残高が紐づく口座を削除しようとした等）。
const FK_VIOLATION_CODE = 'P2003';

// 取得系の戻り（色マスタ込み）。色分け表示に color 名を含める。
export type BankListItem = {
  id: Id;
  name: string;
  colorClassificationId: Id;
  colorName: string;
};

// upsert の失敗種別（機械可読）。UI 文言はサービス/アクション層で付与する。
export type BankUpsertError = 'notFound';
// delete の失敗種別。foreignKey = 紐づく残高があり削除不可。
export type BankDeleteError = 'notFound' | 'foreignKey';

// 色マスタを include し id 昇順で安定させる。
export async function getBankList(
  scope: SessionScope
): Promise<BankListItem[]> {
  const rows = await prisma.bank.findMany({
    where: buildOwnerScopeWhere(scope),
    include: { colorClassification: { select: { id: true, name: true } } },
    orderBy: { id: 'asc' }
  });
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    colorClassificationId: row.colorClassificationId,
    colorName: row.colorClassification.name
  }));
}

export async function insertBank(
  scope: SessionScope,
  input: { name: string; colorClassificationId: Id }
): Promise<void> {
  await prisma.bank.create({
    data: {
      userId: scope.userUid,
      name: input.name,
      colorClassificationId: input.colorClassificationId
    }
  });
}

// updateMany + where に owner scope を AND。count===0 は「他人 or 不存在」= notFound。
export async function updateBank(
  scope: SessionScope,
  input: { id: Id; name: string; colorClassificationId: Id }
): Promise<{ ok: true } | { ok: false; error: BankUpsertError }> {
  const result = await prisma.bank.updateMany({
    where: { AND: [{ id: input.id }, buildOwnerScopeWhere(scope)] },
    data: {
      name: input.name,
      colorClassificationId: input.colorClassificationId
    }
  });
  if (result.count === 0) {
    return { ok: false, error: 'notFound' };
  }
  return { ok: true };
}

// deleteMany + owner scope を AND。count===0 = notFound。
// FK 制約（紐づく bank_balances あり）は P2003 を捕捉して foreignKey に分類する。
export async function deleteBank(
  scope: SessionScope,
  id: Id
): Promise<{ ok: true } | { ok: false; error: BankDeleteError }> {
  try {
    const result = await prisma.bank.deleteMany({
      where: { AND: [{ id }, buildOwnerScopeWhere(scope)] }
    });
    if (result.count === 0) {
      return { ok: false, error: 'notFound' };
    }
    return { ok: true };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === FK_VIOLATION_CODE
    ) {
      return { ok: false, error: 'foreignKey' };
    }
    throw error;
  }
}
