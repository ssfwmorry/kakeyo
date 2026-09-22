import { requireAuth } from '@/features/auth/server/requireAuth';
import { NoteRecordForm } from '@/features/record';
import {
  getMethodCardList,
  getTypeCardList
} from '@/features/type-method/server/services';
import { getPairMode } from '@/lib/server/pair/mode';

// note 画面（/note）の薄いルート（Server Component）。認証 → カテゴリ/方法一覧と
// ペアモードを並行取得し、Client の NoteRecordForm に渡すだけ。
// planned_record（定期）部分は L3 が同画面に統合する。本レーンは record 部分を担う。
// type/method は被参照 feature（type-method）の server サービスから取得する
// （server-only 関数は barrel 経由ではなく server/* を直接 import する）。

export default async function NotePage() {
  const session = await requireAuth();
  const [typeList, methodList, isPair] = await Promise.all([
    getTypeCardList(session),
    getMethodCardList(session),
    getPairMode()
  ]);

  return (
    <main className='mx-auto flex w-full max-w-md flex-col gap-6 p-4'>
      <NoteRecordForm
        typeList={typeList}
        methodList={methodList}
        isPair={isPair}
      />
    </main>
  );
}
