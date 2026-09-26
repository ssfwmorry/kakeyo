import { requireAuth } from '@/features/auth/server/requireAuth';
import { getColorClassifications } from '@/features/master/server/services';
import { MethodScreen } from '@/features/type-method/components/method-screen';
import { getMethodCardList } from '@/features/type-method/server/services';
import { getEffectivePairMode } from '@/lib/server/pair/mode';

// 設定 › 方法。

export default async function MethodPage() {
  const session = await requireAuth();
  const isPair = await getEffectivePairMode(session);
  const [methodList, colors] = await Promise.all([
    getMethodCardList(session),
    getColorClassifications(session)
  ]);

  return (
    <MethodScreen colors={colors} isPair={isPair} methodList={methodList} />
  );
}
