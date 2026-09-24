import { requireAuth } from '@/features/auth/server/requireAuth';
import { NotePlannedRecordForm } from '@/features/planned-record';
import {
  getDayClassifications,
  getPlannedRecordForEdit
} from '@/features/planned-record/server/services';
import { NoteRecordForm } from '@/features/record';
import { getRecordForEdit } from '@/features/record/server/services';
import {
  getMethodCardList,
  getTypeCardList
} from '@/features/type-method/server/services';
import { getEffectivePairMode } from '@/lib/server/pair/mode';
import { parseQueryId } from '@/lib/shared/domain/queryId';
import type { SessionData } from '@/lib/shared/types/auth';

// note 画面（/note）の薄いルート（Server Component）。認証 → カテゴリ/方法一覧・
// 毎月何日か（day）・ペアモードを並行取得し、Client のフォームに渡すだけ。
//
// 既定は record（実績）の入力。planned_record（定期）は毎日つけるものではなく設定なので
// タブには出さず、設定 > 家計管理 > 定期からのみ入る。
// 定期フォームはそのときだけ query で呼び出される:
//   - ?plannedRecordId=<id> : 設定の定期一覧の項目タップ（1 件をプリフィル）
//   - ?planned=new          : 設定の「定期を追加」（新規）
// 実績の編集導線は ?RECORD=<id>（records / calendar から）。
// RECORD と定期指定が同時に来たら record を優先する。
// 新規記録の初期日付は calendar からの遷移時に ?date=YYYY-MM-DD で渡される（plan と同じ受け口）。
// server-only 関数は barrel 経由ではなく server/* を直接 import する。

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// 編集時はモードではなく対象データ自身の共有区分に従う（plan と同じ流儀）。
// record / planned_record は作成時に共有か個人かが決まり後から移せないため、
// Cookie 側のモードと食い違うと、候補に無いカテゴリ・方法を編集させることになる。
// Cookie は書き換えない（Server Component から cookies() は変更できず、Server Action
// 経由にすると誤ったモードで一度描いてから切り替わる）。新規はモードに従う。
function resolveIsPair(
  pairMode: boolean,
  editing: { isPair: boolean } | null
): boolean {
  return editing?.isPair ?? pairMode;
}

// フォームが必要とするデータを一括で並行取得する。
// ?RECORD= / ?plannedRecordId= があればその 1 件を編集対象にする（scope 外・不存在は
// null ＝ 新規扱い。負でない整数のみ受け付ける）。編集対象取得は他のどの取得にも
// 依存しないため同じ Promise.all に載せる。
// 毎月何日かのマスタは定期フォームだけが使い、定期を開きうるかは query だけで決まる
// ため、開きえない既定（実績入力）では引かない。
async function fetchNoteData(
  session: SessionData,
  RECORD?: string,
  plannedRecordId?: string,
  planned?: string
) {
  const editingRecordId = parseQueryId(RECORD);
  const editingPlannedId = parseQueryId(plannedRecordId);
  const mayShowPlanned = planned === 'new' || editingPlannedId !== null;
  const [
    typeList,
    methodList,
    dayClassifications,
    isPair,
    editingRecord,
    editingPlannedRecord
  ] = await Promise.all([
    getTypeCardList(session),
    getMethodCardList(session),
    mayShowPlanned ? getDayClassifications(session) : Promise.resolve([]),
    getEffectivePairMode(session),
    editingRecordId === null
      ? Promise.resolve(null)
      : getRecordForEdit(session, editingRecordId),
    editingPlannedId === null
      ? Promise.resolve(null)
      : getPlannedRecordForEdit(session, editingPlannedId)
  ]);
  return {
    typeList,
    methodList,
    dayClassifications,
    isPair,
    editingRecord,
    editingPlannedRecord
  };
}

export default async function NotePage({
  searchParams
}: {
  searchParams: Promise<{
    RECORD?: string;
    plannedRecordId?: string;
    planned?: string;
    date?: string;
  }>;
}) {
  const session = await requireAuth();
  const { RECORD, plannedRecordId, planned, date } = await searchParams;
  // 形式が YYYY-MM-DD でなければ無視する（クライアント値を素通ししない）。
  const initialDate =
    date !== undefined && DATE_RE.test(date) ? date : undefined;

  const {
    typeList,
    methodList,
    dayClassifications,
    isPair,
    editingRecord,
    editingPlannedRecord
  } = await fetchNoteData(session, RECORD, plannedRecordId, planned);

  const isPlanned =
    !editingRecord && (planned === 'new' || editingPlannedRecord !== null);
  const effectiveIsPair = resolveIsPair(
    isPair,
    isPlanned ? editingPlannedRecord : editingRecord
  );

  return (
    <main className='flex flex-col gap-6 p-4'>
      {isPlanned ? (
        <NotePlannedRecordForm
          typeList={typeList}
          methodList={methodList}
          dayClassifications={dayClassifications}
          isPair={effectiveIsPair}
          editing={editingPlannedRecord ?? undefined}
        />
      ) : (
        <NoteRecordForm
          typeList={typeList}
          methodList={methodList}
          isPair={effectiveIsPair}
          editing={editingRecord ?? undefined}
          initialDate={initialDate}
        />
      )}
    </main>
  );
}
