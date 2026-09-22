import 'server-only';
import { toDateStringJst } from '@/lib/shared/domain/date';
import { RecordType } from '@/lib/shared/types/recordType';
import { SETTLEMENT_DISPLAY } from '../labels';
import type {
  NoteRecordDefault,
  PairedRecordItem,
  RecordListItem,
  SummarizedRecordItem
} from '../types';

// record のデモ用モックデータ（デモログイン時に DB へ触れず返す）。
// withDemoRead に渡す。更新系は withDemoWriteVoid で no-op 成功にするため値は不要。
// id は負値でダミー（実データと衝突しない・BigInt→number 済みの number）。

export const demoRecordList: RecordListItem[] = [
  {
    id: -1,
    isSelf: true,
    datetime: new Date('2026-09-01T03:00:00.000Z'),
    isPay: true,
    price: 1200,
    memo: 'ランチ',
    recordType: RecordType.self,
    plannedRecordId: null,
    methodId: -1,
    methodName: '現金',
    methodColorClassificationName: 'blue',
    typeId: -1,
    typeName: '食費',
    subTypeId: null,
    subTypeName: null,
    typeColorClassificationName: 'orange',
    isPair: false,
    pairUserName: null,
    isInstead: null,
    isSettlement: null
  }
];

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

export const demoSummarizedRecordList: SummarizedRecordItem[] = [
  {
    id: -1,
    isSelf: true,
    datetime: new Date('2026-09-01T03:00:00.000Z'),
    isPay: true,
    price: 1200,
    memo: 'ランチ',
    recordType: RecordType.self,
    plannedRecordId: null,
    methodId: -1,
    methodName: '現金',
    methodColorClassificationName: 'blue',
    typeId: -1,
    typeName: '食費',
    subTypeId: null,
    subTypeName: null,
    typeColorClassificationName: 'orange',
    isPair: false,
    pairUserName: null,
    isInstead: null
  }
];

export const demoPairedRecordList: PairedRecordItem[] = [
  {
    id: -2,
    datetime: new Date('2026-09-02T03:00:00.000Z'),
    isSelf: true,
    isPay: true,
    price: 3000,
    memo: '立替 - 日用品',
    recordType: RecordType.instead,
    isSettled: false,
    isPlannedRecord: false,
    methodName: '現金',
    methodColorClassificationName: 'blue',
    typeName: '日用品',
    subTypeName: null,
    typeColorClassificationName: 'green',
    isInstead: true,
    isSettlement: false
  },
  {
    id: -3,
    datetime: new Date('2026-09-03T03:00:00.000Z'),
    isSelf: true,
    isPay: null,
    price: 1500,
    memo: null,
    recordType: RecordType.settlement,
    isSettled: null,
    isPlannedRecord: false,
    methodName: '振り込み',
    methodColorClassificationName: 'indigo',
    typeName: SETTLEMENT_DISPLAY.name,
    subTypeName: null,
    typeColorClassificationName: SETTLEMENT_DISPLAY.color,
    isInstead: false,
    isSettlement: true
  }
];
