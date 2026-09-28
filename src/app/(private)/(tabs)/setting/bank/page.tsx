import { requireAuth } from '@/features/auth/server/requireAuth';
import { BankSettingScreen } from '@/features/bank/components/bank-setting-screen';
import { getBankList } from '@/features/bank/server/services';
import { getColorClassifications } from '@/features/master/server/services';

// この画面本体はまだセッション由来の取得を Suspense 境界へ落としていないため、
// サーバでブロックしてよい印を立てる（共通 layout の静的シェルは効いている）。
// 外すのは画面ごとの個別タスク（docs/loading-ux/README.md）。
export const instant = false;

// 設定 › 口座。口座は個人専用のマスタなのでペアモードは見ない。
// 残高登録シートの「＋ 口座の行を追加」から来たときは ?add=1 で追加シートを開いた状態にする。

export default async function BankSettingPage({
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
