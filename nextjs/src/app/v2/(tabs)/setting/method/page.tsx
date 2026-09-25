import { requireAuth } from '@/features/auth/server/requireAuth';
import { getColorClassifications } from '@/features/master/server/services';
import { getMethodCardList } from '@/features/type-method/server/services';
import { getEffectivePairMode } from '@/lib/server/pair/mode';
import { MethodScreen } from '@/v2/features/type-method/components/method-screen';

// 設定 › 方法（新デザイン）。

export default async function V2MethodPage() {
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
