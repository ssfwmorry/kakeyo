import 'server-only';
import { demoMaster as master } from '@/features/type-method/server/demo';
import { toDateStringJst, toYearMonthJst } from '@/lib/shared/domain/date';
import { RecordType } from '@/lib/shared/types/recordType';
import { SETTLEMENT_DISPLAY } from '../labels';
import type {
  NoteRecordDefault,
  PairedRecordItem,
  RecordListItem,
  SummarizedRecordItem,
  SummarizedRecordQuery
} from '../types';

// record のデモ用モックデータ。
// typeId / subTypeId / methodId と名前・色は type-method の demoMaster から取る。
// 2026-09 の 1 ヶ月分を置き、summary の demo.ts の同月の集計値と一致させる。

// JST 正午の Date（JST 暦日がずれない時刻で固定）。
function jstNoon(date: string): Date {
  return new Date(`${date}T03:00:00.000Z`);
}

// 個人（solo）の通常記録 1 件分の共通部分。RecordListItem / SummarizedRecordItem の
// 両方へ写す（明細画面は isSettlement を持たない）。
type DemoRecordBase = Omit<RecordListItem, 'isSettlement'>;

type TypeKey = keyof typeof master.type;
type SubTypeKey = keyof typeof master.subType;
type MethodKey = keyof typeof master.method;

function soloRecord(input: {
  id: number;
  date: string;
  isPay: boolean;
  price: number;
  memo: string | null;
  type: TypeKey;
  subType?: SubTypeKey;
  method: MethodKey;
  plannedRecordId?: number;
}): DemoRecordBase {
  const type = master.type[input.type];
  const subType = input.subType ? master.subType[input.subType] : null;
  const method = master.method[input.method];
  return {
    id: input.id,
    isSelf: true,
    datetime: jstNoon(input.date),
    isPay: input.isPay,
    price: input.price,
    memo: input.memo,
    recordType: RecordType.self,
    plannedRecordId: input.plannedRecordId ?? null,
    methodId: method.id,
    methodName: method.name,
    methodColorClassificationName: method.colorName,
    typeId: type.id,
    typeName: type.name,
    subTypeId: subType?.id ?? null,
    subTypeName: subType?.name ?? null,
    typeColorClassificationName: type.colorName,
    isPair: false,
    pairUserName: null,
    isInstead: null
  };
}

// 2026-09 の個人記録。plannedRecordId は planned-record の demo.ts の id。
const demoSoloRecords: DemoRecordBase[] = [
  soloRecord({
    id: 1,
    date: '2026-09-01',
    isPay: true,
    price: 1200,
    memo: 'ランチ',
    type: 'food',
    subType: 'eatOut',
    method: 'cash'
  }),
  soloRecord({
    id: 2,
    date: '2026-09-01',
    isPay: true,
    price: 80000,
    memo: '家賃',
    type: 'housing',
    method: 'debit',
    plannedRecordId: 1
  }),
  soloRecord({
    id: 3,
    date: '2026-09-03',
    isPay: true,
    price: 4800,
    memo: 'スーパー',
    type: 'food',
    subType: 'grocery',
    method: 'credit'
  }),
  soloRecord({
    id: 4,
    date: '2026-09-05',
    isPay: true,
    price: 980,
    memo: '洗剤',
    type: 'daily',
    method: 'cash'
  }),
  soloRecord({
    id: 5,
    date: '2026-09-08',
    isPay: true,
    price: 12000,
    memo: '定期券',
    type: 'transport',
    method: 'credit'
  }),
  soloRecord({
    id: 6,
    date: '2026-09-12',
    isPay: true,
    price: 3600,
    memo: '外食',
    type: 'food',
    subType: 'eatOut',
    method: 'credit'
  }),
  soloRecord({
    id: 7,
    date: '2026-09-15',
    isPay: true,
    price: 5200,
    memo: 'スーパー',
    type: 'food',
    subType: 'grocery',
    method: 'credit'
  }),
  soloRecord({
    id: 8,
    date: '2026-09-20',
    isPay: true,
    price: 520,
    memo: 'ティッシュ',
    type: 'daily',
    method: 'cash'
  }),
  soloRecord({
    id: 9,
    date: '2026-09-22',
    isPay: true,
    price: 480,
    memo: 'コーヒー',
    type: 'food',
    subType: 'eatOut',
    method: 'cash'
  }),
  soloRecord({
    id: 10,
    date: '2026-09-25',
    isPay: false,
    price: 250000,
    memo: '給料',
    type: 'salary',
    method: 'transfer',
    plannedRecordId: 2
  })
];

// カレンダー用（期間指定に関わらず 2026-09 の全件を返す）。
export const demoRecordList: RecordListItem[] = demoSoloRecords.map((row) => ({
  ...row,
  isSettlement: null
}));

// records 明細用。実処理（get_summarized_record_list）と同じく検索条件で絞る
// （支出/収入・カテゴリ or 方法・サブカテゴリ・年月。isPair / isIncludeInstead は
// 個人記録のみのため影響しない）。精算は含まない。
export function findDemoSummarizedRecords(
  query: SummarizedRecordQuery
): SummarizedRecordItem[] {
  return demoSoloRecords.filter((row) => {
    if (row.isPay !== query.isPay) {
      return false;
    }
    if (toYearMonthJst(row.datetime) !== query.yearMonth) {
      return false;
    }
    if (!query.isType) {
      return row.methodId === query.id;
    }
    if (row.typeId !== query.id) {
      return false;
    }
    return query.subTypeId === null || row.subTypeId === query.subTypeId;
  });
}

// note（記録編集）用: デモの record 1 件をプリフィル初期値へ写す。
// scope 検証は無く、demoRecordList から id 一致を引くのみ（デモは DB へ触れない）。
// 精算 record（record_type=15）は編集導線に乗らない前提（本体 findRecordForEdit と同様）。
export function findDemoRecordDefault(id: number): NoteRecordDefault | null {
  const item = demoRecordList.find(
    (row) => row.id === id && row.recordType !== RecordType.settlement
  );
  if (!item) {
    return null;
  }
  return {
    id: item.id,
    isPay: item.isPay ?? true,
    date: toDateStringJst(item.datetime),
    methodId: item.methodId,
    typeId: item.typeId,
    subTypeId: item.subTypeId,
    memo: item.memo,
    price: item.price,
    isInstead: item.isInstead ?? false
  };
}

// 精算画面用のペア記録（立替 1 件 + 精算 1 件）。id は通常記録と重複しない連番の続き。
// ペア前提のモックはここだけ（pair / solo での出し分けは未対応）。
export const demoPairedRecordList: PairedRecordItem[] = [
  {
    id: 11,
    datetime: jstNoon('2026-09-02'),
    isSelf: true,
    isPay: true,
    price: 3000,
    memo: '立替 - 日用品',
    recordType: RecordType.instead,
    isSettled: false,
    isPlannedRecord: false,
    methodName: master.method.cash.name,
    methodColorClassificationName: master.method.cash.colorName,
    typeName: master.type.daily.name,
    subTypeName: null,
    typeColorClassificationName: master.type.daily.colorName,
    isInstead: true,
    isSettlement: false
  },
  {
    id: 12,
    datetime: jstNoon('2026-09-03'),
    isSelf: true,
    isPay: null,
    price: 1500,
    memo: null,
    recordType: RecordType.settlement,
    isSettled: null,
    isPlannedRecord: false,
    methodName: master.method.transfer.name,
    methodColorClassificationName: master.method.transfer.colorName,
    typeName: SETTLEMENT_DISPLAY.name,
    subTypeName: null,
    typeColorClassificationName: SETTLEMENT_DISPLAY.color,
    isInstead: false,
    isSettlement: true
  }
];
