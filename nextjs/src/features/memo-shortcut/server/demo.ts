import 'server-only';
import { RecordType } from '@/lib/shared/types/recordType';
import type { MemoItem, ShortCutItem } from '../types';

// L8 memo/shortcut のデモ用モックデータ（デモログイン時に DB へ触れず返す）。
// withDemoRead に渡す。更新系は withDemoWriteVoid で no-op 成功にするため値は不要。
// id は実データと衝突しないよう負値にする（bank/type-method のデモに倣う）。

export const demoMemoList: MemoItem[] = [
  { id: -1, memo: '牛乳を買う', isPair: false },
  { id: -2, memo: '電気代を振り込む', isPair: true }
];

export const demoShortCutList: ShortCutItem[] = [
  {
    id: -1,
    isPay: true,
    price: 500,
    memo: 'ランチ',
    recordType: RecordType.self,
    methodId: -1,
    methodName: '現金',
    typeId: -1,
    typeName: '食費',
    colorName: 'orange',
    subTypeId: null,
    subTypeName: null
  },
  {
    id: -2,
    isPay: true,
    price: 1200,
    memo: null,
    recordType: RecordType.pair,
    methodId: -2,
    methodName: 'クレジット',
    typeId: -2,
    typeName: '日用品',
    colorName: 'blue',
    subTypeId: -1,
    subTypeName: '消耗品'
  }
];
