import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { requireAuth } from '@/features/auth/server/requireAuth';
import { NotePlannedRecordForm } from '@/features/planned-record';
import {
  getDayClassifications,
  getPlannedRecordForEdit
} from '@/features/planned-record/server/services';
import { NoteRecordForm } from '@/features/record';
import {
  getMethodCardList,
  getTypeCardList
} from '@/features/type-method/server/services';
import { getPairMode } from '@/lib/server/pair/mode';

// note 画面（/note）の薄いルート（Server Component）。認証 → カテゴリ/方法一覧・
// 毎月何日か（day）・ペアモードを並行取得し、Client のフォームに渡すだけ。
// record（実績）と planned_record（定期）を「記録」「定期」タブで切り替える
// （fe-screens §NOTE: 同一 UI で record / planned_record を扱う）。
// setting の定期一覧から「編集」で ?plannedRecordId=<id> 付きで遷移してきた場合は
// 定期タブを初期表示し、その 1 件を編集フォームにプリフィルする。
// type/method/day は被参照 feature の server サービスから取得する
// （server-only 関数は barrel 経由ではなく server/* を直接 import する）。

export default async function NotePage({
  searchParams
}: {
  searchParams: Promise<{ plannedRecordId?: string }>;
}) {
  const session = await requireAuth();
  const { plannedRecordId } = await searchParams;

  const [typeList, methodList, dayClassifications, isPair] = await Promise.all([
    getTypeCardList(session),
    getMethodCardList(session),
    getDayClassifications(session),
    getPairMode()
  ]);

  // ?plannedRecordId= があれば定期タブを初期表示し、その 1 件を編集対象にする。
  // scope 外・不存在なら null（＝新規扱い）。負でない整数のみ受け付ける。
  const editingId = parsePositiveInt(plannedRecordId);
  const editingPlannedRecord =
    editingId === null
      ? null
      : await getPlannedRecordForEdit(session, editingId);
  const defaultTab = editingPlannedRecord ? 'planned' : 'record';

  return (
    <main className='mx-auto flex w-full max-w-md flex-col gap-6 p-4'>
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

// query の plannedRecordId を正の整数として読む（不正・0・負は null）。
function parsePositiveInt(value: string | undefined): number | null {
  if (value === undefined) {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}
