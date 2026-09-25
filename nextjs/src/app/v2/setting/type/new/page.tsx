import { requireAuth } from '@/features/auth/server/requireAuth';
import { getColorClassifications } from '@/features/master/server/services';
import { getEffectivePairMode } from '@/lib/server/pair/mode';
import { TypeEditScreen } from '@/v2/features/type-method/components/type-edit-screen';

// 設定 › カテゴリを追加（新デザイン）。編集と同じ画面を使い、対象なしで開く。
// 支出 / 収入は一覧のどちらのタブから来たかで決まるのでクエリで受ける。

export default async function V2TypeNewPage({
  searchParams
}: {
  searchParams: Promise<{ isPay?: string }>;
}) {
  const session = await requireAuth();
  const [isPair, colors, query] = await Promise.all([
    getEffectivePairMode(session),
    getColorClassifications(session),
    searchParams
  ]);

  return (
    <TypeEditScreen
      colors={colors}
      isPair={isPair}
      isPay={query.isPay !== 'false'}
    />
  );
}
