import { notFound } from 'next/navigation';
import { requireAuth } from '@/features/auth/server/requireAuth';
import { getColorClassifications } from '@/features/master/server/services';
import { getTypeCardList } from '@/features/type-method/server/services';
import { getEffectivePairMode } from '@/lib/server/pair/mode';
import { TypeEditScreen } from '@/v2/features/type-method/components/type-edit-screen';

// 設定 › カテゴリを編集（新デザイン）。
//
// 1 件だけ取るサービスは無いので、一覧から絞る。カテゴリは数十件の規模で、
// 一覧は設定画面が既に取得しているため、専用の取得系を足すほどの重さはない。

export default async function V2TypeEditPage({
  params,
  searchParams
}: {
  params: Promise<{ typeId: string }>;
  searchParams: Promise<{ isPay?: string }>;
}) {
  const session = await requireAuth();
  const [isPair, colors, typeList, routeParams, query] = await Promise.all([
    getEffectivePairMode(session),
    getColorClassifications(session),
    getTypeCardList(session),
    params,
    searchParams
  ]);

  const isPay = query.isPay !== 'false';
  const bucket = typeList[isPay ? 'pay' : 'income'];
  const typeId = Number(routeParams.typeId);
  const type = (isPair ? bucket.pair : bucket.self).find(
    (card) => card.id === typeId
  );

  // scope 外・不存在・収支違いはまとめて 404。存在の有無を漏らさない。
  if (type === undefined) {
    notFound();
  }

  return (
    <TypeEditScreen colors={colors} isPair={isPair} isPay={isPay} type={type} />
  );
}
