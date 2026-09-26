import { requireAuth } from '@/features/auth/server/requireAuth';
import { getBankList } from '@/features/bank/server/services';
import { getColorClassifications } from '@/features/master/server/services';
import { BankSettingScreen } from '@/v2/features/bank/components/bank-setting-screen';

// 設定 › 口座（新デザイン）。口座は個人専用のマスタなのでペアモードは見ない。
// 残高登録シートの「＋ 口座の行を追加」から来たときは ?add=1 で追加シートを開いた状態にする。

export default async function V2BankSettingPage({
  searchParams
}: {
  searchParams: Promise<{ add?: string }>;
}) {
  const session = await requireAuth();
  const [banks, colors, query] = await Promise.all([
    getBankList(session),
    getColorClassifications(session),
    searchParams
  ]);

  return (
    <BankSettingScreen
      banks={banks}
      colors={colors}
      initialAdd={query.add === '1'}
    />
  );
}
