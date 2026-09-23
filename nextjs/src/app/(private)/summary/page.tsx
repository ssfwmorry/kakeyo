import { requireAuth } from '@/features/auth/server/requireAuth';
import { getPairedRecords } from '@/features/record/server/services';
import { SummaryScreen } from '@/features/summary';
import {
  getMethodCardList,
  getTypeChips
} from '@/features/summary/server/services';
import { getEffectivePairMode } from '@/lib/server/pair/mode';
import { toYearMonthJst } from '@/lib/shared/domain/date';

// 集計画面（/summary）の薄いルート（Server Component）。認証 → ペアモード・カテゴリチップ・
// 精算タブ初期データを取得し Client の SummaryScreen に渡す。整形・状態は下位に委ねる。
// 各集計は Client のタブが年月/トグルを変えて Server Action から取得する。

export default async function SummaryPage() {
  const session = await requireAuth();
  const isExistPair = session.pairId !== null;
  const yearMonth = toYearMonthJst(new Date());

  const [isPair, typeChips, pairedRecords, methodList] = await Promise.all([
    getEffectivePairMode(session),
    getTypeChips(session),
    // 精算タブは isExistPair のときのみ表示するが、Server では常に取得しても
    // getPairedRecords が pairId===null で空配列を返すため安全（無駄な取得は isExistPair で抑制）。
    isExistPair ? getPairedRecords(session, yearMonth) : Promise.resolve([]),
    isExistPair
      ? getMethodCardList(session)
      : Promise.resolve({
          income: { self: [], pair: [] },
          pay: { self: [], pair: [] },
          both: { self: [], pair: [] }
        })
  ]);

  const settlementMethods = methodList.both.pair.map((method) => ({
    id: method.id,
    name: method.name
  }));

  return (
    <SummaryScreen
      isPair={isPair}
      isExistPair={isExistPair}
      typeChips={typeChips}
      pairedRecords={pairedRecords}
      settlementMethods={settlementMethods}
      yearMonth={yearMonth}
    />
  );
}
