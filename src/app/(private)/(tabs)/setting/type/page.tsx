import { requireAuth } from '@/features/auth/server/requireAuth';
import { getColorClassifications } from '@/features/master/server/services';
import { TypeScreen } from '@/features/type-method/components/type-screen';
import { getTypeCardList } from '@/features/type-method/server/services';
import { getEffectivePairMode } from '@/lib/server/pair/mode';

// この画面本体はまだセッション由来の取得を Suspense 境界へ落としていないため、
// サーバでブロックしてよい印を立てる（共通 layout の静的シェルは効いている）。
// 外すのは画面ごとの個別タスク。
export const instant = false;

// 設定 › カテゴリ一覧。追加・編集のシートが使う色の候補もここで取る。

export default async function TypePage() {
  const session = await requireAuth();
  const isPair = await getEffectivePairMode(session);
  const [typeList, colors] = await Promise.all([
    getTypeCardList(session),
    getColorClassifications(session)
  ]);

  return <TypeScreen colors={colors} isPair={isPair} typeList={typeList} />;
}
