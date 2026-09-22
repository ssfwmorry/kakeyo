import 'server-only';
import { prisma } from '@/lib/server/db/client';
import { buildOwnerScopeWhere } from '@/lib/shared/db/scope';
import type { SessionScope } from '@/lib/shared/types/auth';
import type { Id } from '@/lib/shared/types/id';
import type { RecordType } from '@/lib/shared/types/recordType';

// short_cut は個人専用テーブル（pair で共有しない）ため取得は buildOwnerScopeWhere
// （buildScopeWhere ではない）を通す。short_cuts.id は BigInt のため境界で Number 変換する。
// 本レーンは一覧取得のみ（作成/削除なし）。記録自体は record ドメインの upsertRecord が担う。

// ショートカット 1 件（type/sub_type/method・color 名を結合済み）。
export type ShortCutListItem = {
  id: Id;
  isPay: boolean;
  price: number;
  memo: string | null;
  recordType: RecordType;
  methodId: Id;
  methodName: string;
  typeId: Id;
  typeName: string;
  // type の色名（ショートカットカードの色分けに使う）。
  colorName: string;
  subTypeId: Id | null;
  subTypeName: string | null;
};

export async function getShortCutList(
  scope: SessionScope
): Promise<ShortCutListItem[]> {
  const rows = await prisma.shortCut.findMany({
    where: buildOwnerScopeWhere(scope),
    include: {
      method: { select: { id: true, name: true } },
      type: {
        select: {
          id: true,
          name: true,
          colorClassification: { select: { name: true } }
        }
      },
      subType: { select: { id: true, name: true } }
    },
    orderBy: { id: 'asc' }
  });
  return rows.map((row) => ({
    // BigInt → number の境界変換。ここでしか BigInt を露出させない。
    id: Number(row.id),
    isPay: row.isPay,
    price: row.price,
    memo: row.memo,
    recordType: row.recordType as RecordType,
    methodId: row.methodId,
    methodName: row.method.name,
    typeId: row.typeId,
    typeName: row.type.name,
    colorName: row.type.colorClassification.name,
    subTypeId: row.subTypeId,
    subTypeName: row.subType?.name ?? null
  }));
}
