import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

// note 画面（/note）の薄いルート（Server Component）。認証 → カテゴリ/方法一覧・
// 毎月何日か（day）・ペアモードを並行取得し、Client のフォームに渡すだけ。
// record（実績）と planned_record（定期）を「記録」「定期」タブで切り替える。
// 編集導線は 2 系統:
//   - ?RECORD=<id>          : records/calendar から。記録タブを初期表示し record 1 件をプリフィル。
//   - ?plannedRecordId=<id> : setting の定期一覧から。定期タブを初期表示し planned 1 件をプリフィル。
// 両者が同時に来ることは無い想定だが、来た場合は record を優先する（記録タブ）。
// server-only 関数は barrel 経由ではなく server/* を直接 import する。

export default async function NotePage({
  searchParams
}: {
  searchParams: Promise<{ RECORD?: string; plannedRecordId?: string }>;
}) {
  const session = await requireAuth();
  const { RECORD, plannedRecordId } = await searchParams;

  // ?RECORD= / ?plannedRecordId= があれば該当タブを初期表示し、その 1 件を編集対象にする。
  // scope 外・不存在なら null（＝新規扱い）。負でない整数のみ受け付ける。
  // 編集対象取得は他のどの取得にも依存しないため一括で並行取得する。
  const editingRecordId = parseQueryId(RECORD);
  const editingPlannedId = parseQueryId(plannedRecordId);
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
    getDayClassifications(session),
    getEffectivePairMode(session),
    editingRecordId === null
      ? Promise.resolve(null)
      : getRecordForEdit(session, editingRecordId),
    editingPlannedId === null
      ? Promise.resolve(null)
      : getPlannedRecordForEdit(session, editingPlannedId)
  ]);

  // record 編集が来ていれば記録タブ、定期編集のみなら定期タブを初期表示する。
  const defaultTab =
    !editingRecord && editingPlannedRecord ? 'planned' : 'record';

  return (
    <main className='flex flex-col gap-6 p-4'>
      <Tabs defaultValue={defaultTab}>
        <TabsList className='grid w-full grid-cols-2'>
          <TabsTrigger value='record'>記録</TabsTrigger>
          <TabsTrigger value='planned'>定期</TabsTrigger>
        </TabsList>
        <TabsContent value='record'>
          <NoteRecordForm
            typeList={typeList}
            methodList={methodList}
            isPair={isPair}
            editing={editingRecord ?? undefined}
          />
        </TabsContent>
        <TabsContent value='planned'>
          <NotePlannedRecordForm
            typeList={typeList}
            methodList={methodList}
            dayClassifications={dayClassifications}
            isPair={isPair}
            editing={editingPlannedRecord ?? undefined}
          />
        </TabsContent>
      </Tabs>
    </main>
  );
}
