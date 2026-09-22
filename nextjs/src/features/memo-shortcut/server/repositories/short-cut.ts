import 'server-only';
import { prisma } from '@/lib/server/db/client';
import { buildOwnerScopeWhere } from '@/lib/shared/db/scope';
import type { SessionScope } from '@/lib/shared/types/auth';
import type { Id } from '@/lib/shared/types/id';
import type { RecordType } from '@/lib/shared/types/recordType';

// L8 short_cut（ショートカット）レーンのリポジトリ（server-only）。
// ★ short_cut は個人専用テーブル（pair で共有しない）。取得は必ず
//   buildOwnerScopeWhere（自分の user_id のみ）を通す。scope 漏れ = 情報漏洩。
// ★ short_cuts.id は Prisma 上 BigInt。JSON.stringify で例外を投げるため
//   Server→Client を跨ぐとクラッシュする。境界で Number(row.id) へ変換し、
//   公開型は id: number（= Id）で固定する（方針確定書 §4.1）。
// ※ 旧 Nuxt に short_cut の作成/削除 API は存在せず（be-api.md）、本レーンは
//   一覧取得（getShortCutList）のみを実装する。記録は record ドメインの upsertRecord。

// ショートカット 1 件（type/sub_type/method・color 名を結合済み）。
// price は Int（金額）。record_type は records と同様の分類。
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
  // サブカテゴリは任意。未設定なら null。
  subTypeId: Id | null;
  subTypeName: string | null;
};

// READ
// 個人専用のため buildOwnerScopeWhere。type/method/subType を include し、
// type 経由で color 名を取り出す。id 昇順で安定させる。
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
    // ★ BigInt → number の境界変換。ここでしか BigInt を露出させない。
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
