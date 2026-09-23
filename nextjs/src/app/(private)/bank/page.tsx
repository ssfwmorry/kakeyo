import { requireAuth } from '@/features/auth/server/requireAuth';
import { BankScreen } from '@/features/bank';
import { getBankScreenData } from '@/features/bank/server/services';

// bank 画面（/bank）の薄いルート（Server Component）。認証 → 画面データを取得し、
// Client の BankScreen に渡すだけ。データ整形・状態は下位に委ねる。
// 口座マスタの追加/編集は設定画面（/setting）側の責務のため、色マスタはここでは取得しない。

export default async function BankPage() {
  const session = await requireAuth();
  const data = await getBankScreenData(session);

  return <BankScreen {...data} />;
}
