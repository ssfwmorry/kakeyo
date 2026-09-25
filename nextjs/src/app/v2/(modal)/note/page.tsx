import { requireAuth } from '@/features/auth/server/requireAuth';
import { getShortCutList } from '@/features/memo-shortcut/server/services';
import { getRecordForEdit } from '@/features/record/server/services';
import {
  getMethodCardList,
  getTypeCardList
} from '@/features/type-method/server/services';
import { getEffectivePairMode } from '@/lib/server/pair/mode';
import { todayJst } from '@/lib/shared/domain/date';
import { parseQueryId } from '@/lib/shared/domain/queryId';
import { NoteScreen } from '@/v2/features/note/components/note-screen';

// 入力フロー（新デザイン）。タブバー中央の ＋ とカレンダーの「記録」から開く。
// 新規記録の初期日付はカレンダーから ?date=YYYY-MM-DD で渡される（旧 /note と同じ受け口）。
// 記録の編集はカレンダーの日別リストから ?RECORD=<id> で来る（scope 外・不存在は新規扱い）。
//
// 定期の記録は旧 /note のまま。

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function V2NotePage({
  searchParams
}: {
  searchParams: Promise<{ date?: string; RECORD?: string }>;
}) {
  const session = await requireAuth();
  const { date, RECORD } = await searchParams;
  const today = todayJst();
  // 形式が YYYY-MM-DD でなければ無視する（クライアント値を素通ししない）。
  const initialDate = date !== undefined && DATE_RE.test(date) ? date : today;
  const editingId = parseQueryId(RECORD);

  const [typeList, methodList, shortcuts, pairMode, editing] =
    await Promise.all([
      getTypeCardList(session),
      getMethodCardList(session),
      getShortCutList(session),
      getEffectivePairMode(session),
      editingId === null
        ? Promise.resolve(null)
        : getRecordForEdit(session, editingId)
    ]);
  // 編集はモードではなく対象データ自身の共有区分に従う。記録は作成時に共有か個人かが
  // 決まり後から移せないため、Cookie 側と食い違うと候補に無いカテゴリを編集させることになる。
  const isPair = editing?.isPair ?? pairMode;

  return (
    <NoteScreen
      editing={editing ?? undefined}
      initialDate={initialDate}
      isPair={isPair}
      methodList={methodList}
      shortcuts={shortcuts}
      today={today}
      typeList={typeList}
    />
  );
}
