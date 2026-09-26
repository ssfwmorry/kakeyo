import { requireAuth } from '@/features/auth/server/requireAuth';
import { TypeScreen } from '@/features/type-method/components/type-screen';
import { getTypeCardList } from '@/features/type-method/server/services';
import { getEffectivePairMode } from '@/lib/server/pair/mode';

// 設定 › カテゴリ一覧。

export default async function TypePage() {
  const session = await requireAuth();
  const isPair = await getEffectivePairMode(session);
  const typeList = await getTypeCardList(session);

  return <TypeScreen isPair={isPair} typeList={typeList} />;
}
