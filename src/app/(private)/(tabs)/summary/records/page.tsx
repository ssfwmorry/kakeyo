import { notFound } from 'next/navigation';
import { requireAuth } from '@/features/auth/server/requireAuth';
import { getSummarizedRecords } from '@/features/record/server/services';
import { RecordsScreen } from '@/features/summary/components/records-screen';
import {
  parseRecordsQuery,
  type RecordsQuery
} from '@/features/summary/domain/records-query';
import { getEffectivePairMode } from '@/lib/server/pair/mode';

// この画面本体はまだセッション由来の取得を Suspense 境界へ落としていないため、
// サーバでブロックしてよい印を立てる（共通 layout の静的シェルは効いている）。
// 外すのは画面ごとの個別タスク（docs/loading-ux/README.md）。
export const instant = false;

// 集計 › 明細。内訳の行から絞り込みを引き継いで開く。
//
// 絞り込みはクエリで受けるが、クライアントの値は信用しない:
// - scope はリポジトリ層（buildScopeWhere）が担保するので、他ペアの id を渡しても空になる。
// - isPair はセッションから確定する（ペアのいないユーザは常に個人）。
// 名前と色だけは表示のためにクエリで受け取る（数字には効かない）。

export default async function SummaryRecordsPage({
  searchParams
}: {
  searchParams: Promise<RecordsQuery>;
}) {
  const [session, query] = await Promise.all([requireAuth(), searchParams]);
  const isPair = await getEffectivePairMode(session);

  const condition = parseRecordsQuery(query, isPair);
  if (condition === null) {
    notFound();
  }

  const records = await getSummarizedRecords(session, {
    isType: condition.isType,
    isPay: condition.isPay,
    isPair: condition.isPair,
    isIncludeInstead: condition.isIncludeInstead,
    yearMonth: condition.yearMonth,
    id: condition.id,
    subTypeId: condition.subTypeId
  });

  return (
    <RecordsScreen
      colorName={condition.colorName}
      initialRecords={records}
      initialYearMonth={condition.yearMonth}
      key={isPair ? 'pair' : 'self'}
      target={condition}
    />
  );
}
