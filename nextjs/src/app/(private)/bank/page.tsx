import { requireAuth } from '@/features/auth/server/requireAuth';
import { BankScreen } from '@/features/bank';
import { getBankScreenData } from '@/features/bank/server/services';
import { getColorClassificationList } from '@/features/master/server/repositories/colorClassification';

// bank 画面（/bank）の薄いルート（Server Component）。認証 → 画面データ + 色マスタを
// 並行取得し、Client の BankScreen に渡すだけ。データ整形・状態は下位に委ねる。
// bank は独立画面のため、このルートを本レーンで用意する（setting 統合とは別導線）。

export default async function BankPage() {
  const session = await requireAuth();
  const [data, colors] = await Promise.all([
    getBankScreenData(session),
    getColorClassificationList()
  ]);

  return <BankScreen {...data} colors={colors} />;
}
