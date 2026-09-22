import { requireAuth } from '@/features/auth/server/requireAuth';
import { PlanScreen } from '@/features/plan-reminder';
import { getPlanTypeCardList } from '@/features/plan-reminder/server/services';
import { getPairMode } from '@/lib/server/pair/mode';

// 予定入力画面（/plan）の薄いルート（Server Component）。認証 → 予定カテゴリ一覧 +
// ペアモードを取得し Client の PlanScreen に渡すだけ。整形・状態は下位に委ねる。
// 新規作成の初期日付は calendar からの遷移時に ?date=YYYY-MM-DD で渡される想定。

type PlanPageProps = {
  searchParams: Promise<{ date?: string }>;
};

export default async function PlanPage({ searchParams }: PlanPageProps) {
  const session = await requireAuth();
  const { date } = await searchParams;
  const [planTypeList, pairMode] = await Promise.all([
    getPlanTypeCardList(session),
    getPairMode()
  ]);
  // pairId が無ければ個人スコープ固定（ペアモードに関わらず self）。
  const isPair = session.pairId !== null && pairMode;

  return (
    <PlanScreen
      planTypeList={planTypeList}
      isPair={isPair}
      initialDate={date}
    />
  );
}
