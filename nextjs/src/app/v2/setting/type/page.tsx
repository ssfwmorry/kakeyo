import { requireAuth } from '@/features/auth/server/requireAuth';
import { getTypeCardList } from '@/features/type-method/server/services';
import { getEffectivePairMode } from '@/lib/server/pair/mode';
import { TypeScreen } from '@/v2/features/type-method/components/type-screen';

// 設定 › カテゴリ一覧（新デザイン）。

export default async function V2TypePage() {
  const session = await requireAuth();
  const isPair = await getEffectivePairMode(session);
  const typeList = await getTypeCardList(session);

  return <TypeScreen isPair={isPair} typeList={typeList} />;
}
