import 'server-only';
import { RecordType } from '@/lib/shared/types/recordType';
import type { MemoItem, ShortCutItem } from '../types';

// memo/shortcut のデモ用モックデータ。
// typeId / subTypeId / methodId と名前・色は type-method の demo.ts に合わせる。
// 個人（solo）前提のため isPair / recordType は個人固定。

export const demoMemoList: MemoItem[] = [
  { id: 1, memo: '牛乳を買う', isPair: false },
  { id: 2, memo: '電気代を振り込む', isPair: false }
];

export const demoShortCutList: ShortCutItem[] = [
  {
    id: 1,
    isPay: true,
    price: 500,
    memo: 'ランチ',
    recordType: RecordType.self,
    methodId: 1,
    methodName: '現金',
    typeId: 1,
    typeName: '食費',
    colorName: 'orange',
    subTypeId: 1,
    subTypeName: '外食'
  },
  {
    id: 2,
    isPay: true,
    price: 200,
    memo: '電車',
    recordType: RecordType.self,
    methodId: 1,
    methodName: '現金',
    typeId: 3,
    typeName: '交通費',
    colorName: 'blue',
    subTypeId: null,
    subTypeName: null
  }
];
