import { requireAuth } from '@/features/auth/server/requireAuth';
import { getShortCutList } from '@/features/memo-shortcut/server/services';
import {
  getMethodCardList,
  getTypeCardList
} from '@/features/type-method/server/services';
import { getEffectivePairMode } from '@/lib/server/pair/mode';
import { todayJst } from '@/lib/shared/domain/date';
import { NoteScreen } from '@/v2/features/note/components/note-screen';

// 入力フロー（新デザイン）。タブバー中央の ＋ とカレンダーの「記録」から開く。
// 新規記録の初期日付はカレンダーから ?date=YYYY-MM-DD で渡される（旧 /note と同じ受け口）。
//
// 定期の記録・記録の編集は旧 /note のまま（T13 で作り直す）。

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function V2NotePage({
  searchParams
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const session = await requireAuth();
  const { date } = await searchParams;
  const today = todayJst();
  // 形式が YYYY-MM-DD でなければ無視する（クライアント値を素通ししない）。
  const initialDate = date !== undefined && DATE_RE.test(date) ? date : today;

  const [typeList, methodList, shortcuts, isPair] = await Promise.all([
    getTypeCardList(session),
    getMethodCardList(session),
    getShortCutList(session),
    getEffectivePairMode(session)
  ]);

  return (
    <NoteScreen
      initialDate={initialDate}
      isPair={isPair}
      methodList={methodList}
      shortcuts={shortcuts}
      today={today}
      typeList={typeList}
    />
  );
}
