import { redirect } from 'next/navigation';
import { requireAuth } from '@/features/auth/server/requireAuth';
import { getSummarizedRecords } from '@/features/record/server/services';
import { RecordsScreen } from '@/features/summary';
import { fromRecordsSearchParams } from '@/features/summary/records-query';

// URL クエリから検索条件を組む。パラメータ欠落は不正遷移として summary へ戻す。
// records は個人専用（ペア切替を出さない）。

type RecordsPageProps = {
  // Next.js 16: searchParams は Promise。
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RecordsPage({ searchParams }: RecordsPageProps) {
  const session = await requireAuth();
  const sp = await searchParams;
  const query = fromRecordsSearchParams(sp);
  if (query === null) {
    redirect('/summary');
  }

  const initialRecords = await getSummarizedRecords(session, {
    isPay: query.isPay,
    isType: query.isType,
    isPair: query.isPair,
    isIncludeInstead: query.isIncludeInstead,
    yearMonth: query.yearMonth,
    id: query.id,
    subTypeId: query.subTypeId
  });

  return <RecordsScreen query={query} initialRecords={initialRecords} />;
}
