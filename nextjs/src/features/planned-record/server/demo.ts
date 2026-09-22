import 'server-only';
import type { DayClassification } from '@/features/master';
import type {
  GroupedPlannedRecordList,
  NotePlannedRecordDefault,
  PlannedRecordListItem
} from '../types';

// L3 のデモ用モックデータ（デモログイン時に DB へ触れず返す）。
// withDemoRead に渡す。更新系は withDemoWriteVoid で no-op 成功にするため値は不要。
// id は負値にして実データと衝突させない（他レーンの demo と同方針）。

// note（定期入力）の day 選択肢モック（day_classifications は全ユーザ共通の静的
// マスタだが、デモは DB へ触れないため実マスタ相当の代表値を返す）。
export const demoDayClassifications: DayClassification[] = [
  { id: 1, name: '毎月 1 日', value: 1 },
  { id: 2, name: '毎月 10 日', value: 10 },
  { id: 3, name: '毎月 15 日', value: 15 },
  { id: 4, name: '毎月 25 日', value: 25 }
];

export const demoGroupedPlannedRecordList: GroupedPlannedRecordList = {
  self: [
    {
      id: -1,
      isSelf: true,
      isPay: true,
      price: 80000,
      memo: '家賃',
      sort: 1,
      isPair: false,
      pairUserName: null,
      dayClassificationId: 1,
      dayClassificationName: '毎月 1 日',
      methodId: -1,
      methodName: '銀行引落',
      methodColorClassificationName: 'indigo',
      typeId: -2,
      typeName: '住居',
      typeColorClassificationName: 'brown',
      subTypeId: null,
      subTypeName: null
    },
    {
      id: -2,
      isSelf: true,
      isPay: false,
      price: 250000,
      memo: '給料',
      sort: 2,
      isPair: false,
      pairUserName: null,
      dayClassificationId: 4,
      dayClassificationName: '毎月 25 日',
      methodId: -1,
      methodName: '銀行引落',
      methodColorClassificationName: 'indigo',
      typeId: -3,
      typeName: '給与',
      typeColorClassificationName: 'green',
      subTypeId: null,
      subTypeName: null
    }
  ],
  pair: []
};

// note（定期編集）のデモ初期値。一覧のモックから該当 id を引いて組む
// （見つからなければ null = 新規扱い）。
export function findDemoPlannedRecordDefault(
  id: number
): NotePlannedRecordDefault | null {
  const item = [
    ...demoGroupedPlannedRecordList.self,
    ...demoGroupedPlannedRecordList.pair
  ].find((row) => row.id === id);
  if (!item) {
    return null;
  }
  return toDemoDefault(item);
}

function toDemoDefault(item: PlannedRecordListItem): NotePlannedRecordDefault {
  return {
    id: item.id,
    isPay: item.isPay,
    dayClassificationId: item.dayClassificationId,
    methodId: item.methodId,
    typeId: item.typeId,
    subTypeId: item.subTypeId,
    memo: item.memo,
    price: item.price,
    // 旧 note の `!!plannedRecord.pairUserName`（共有かつ立替者あり）と同じ導出。
    isInstead: item.isPair && item.pairUserName !== null,
    isPair: item.isPair
  };
}
