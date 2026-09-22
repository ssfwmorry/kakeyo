import 'server-only';
import { RecordType } from '@/lib/shared/types/recordType';
import { SETTLEMENT_DISPLAY } from '../labels';
import type {
  PairedRecordItem,
  RecordListItem,
  SummarizedRecordItem
} from '../types';

// L2 のデモ用モックデータ（デモログイン時に DB へ触れず返す）。
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
