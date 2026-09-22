import { requireAuth } from '@/features/auth/server/requireAuth';
import { PlanScreen } from '@/features/plan-reminder';
import {
  getPlanForEdit,
  getPlanTypeCardList
} from '@/features/plan-reminder/server/services';
import { getPairMode } from '@/lib/server/pair/mode';
import { parseQueryId } from '@/lib/shared/domain/queryId';

// 予定入力画面（/plan）の薄いルート（Server Component）。認証 → 予定カテゴリ一覧 +
// ペアモードを取得し Client の PlanScreen に渡すだけ。整形・状態は下位に委ねる。
// 新規作成の初期日付は calendar からの遷移時に ?date=YYYY-MM-DD で渡される。
// calendar のイベント編集からは ?planId=<id> で来る → その 1 件を編集フォームにプリフィル。

type PlanPageProps = {
  searchParams: Promise<{ date?: string; planId?: string }>;
};

export default async function PlanPage({ searchParams }: PlanPageProps) {
  const session = await requireAuth();
  const { date, planId } = await searchParams;
  const editingId = parseQueryId(planId);
  const [planTypeList, pairMode, editing] = await Promise.all([
    getPlanTypeCardList(session),
    getPairMode(),
    editingId === null
      ? Promise.resolve(null)
      : getPlanForEdit(session, editingId)
  ]);
  // 編集時は対象 plan 自身の共有区分を使う（カテゴリ候補 self/pair を対象に合わせる）。
  // 新規時は現在のペアモード（pairId が無ければ個人固定）に従う。
  const isPair = editing ? editing.isPair : session.pairId !== null && pairMode;

  return (
    <PlanScreen
      planTypeList={planTypeList}
      isPair={isPair}
      editing={editing ?? undefined}
      initialDate={date}
    />
  );
}
