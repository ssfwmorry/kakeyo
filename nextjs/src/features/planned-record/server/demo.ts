import 'server-only';
import type { DayClassification } from '@/features/master';
import type {
  GroupedPlannedRecordList,
  NotePlannedRecordDefault,
  PlannedRecordListItem
} from '../types';

// planned-record のデモ用モックデータ。
// typeId / methodId と名前・色は type-method の demo.ts に合わせる。

// day 選択肢は全ユーザ共通の静的マスタだが、デモは DB へ触れないため実マスタと同じ値を持つ。
export const demoDayClassifications: DayClassification[] = [
  { id: 1, name: '毎月 1 日', value: 1 },
  { id: 2, name: '毎月 10 日', value: 10 },
  { id: 3, name: '毎月 15 日', value: 15 },
  { id: 4, name: '毎月 25 日', value: 25 }
];

export const demoGroupedPlannedRecordList: GroupedPlannedRecordList = {
  self: [
    {
      id: 1,
      isSelf: true,
      isPay: true,
      price: 80000,
      memo: '家賃',
      sort: 1,
      isPair: false,
      pairUserName: null,
      dayClassificationId: 1,
      dayClassificationName: '毎月 1 日',
      methodId: 3,
      methodName: '銀行引落',
      methodColorClassificationName: 'blue-grey',
      typeId: 4,
      typeName: '住居',
      typeColorClassificationName: 'brown',
      subTypeId: null,
      subTypeName: null
    },
    {
      id: 2,
      isSelf: true,
      isPay: false,
      price: 250000,
      memo: '給料',
      sort: 2,
      isPair: false,
      pairUserName: null,
      dayClassificationId: 4,
      dayClassificationName: '毎月 25 日',
      methodId: 4,
      methodName: '銀行振込',
      methodColorClassificationName: 'teal',
      typeId: 5,
      typeName: '給与',
      typeColorClassificationName: 'teal',
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
    // 共有かつ立替者ありのとき isInstead=true。
    isInstead: item.isPair && item.pairUserName !== null,
    isPair: item.isPair
  };
}
