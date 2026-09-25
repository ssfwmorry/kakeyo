import { describe, expect, it } from 'vitest';
import type { RecordListItem } from '@/features/record';
import { RecordType } from '@/lib/shared/types/recordType';
import { toRecordDefault } from './record-default';

function record(overrides: Partial<RecordListItem> = {}): RecordListItem {
  return {
    id: 1,
    isSelf: true,
    // 2026-09-25 23:30 JST。UTC では同日 14:30。
    datetime: new Date('2026-09-25T14:30:00Z'),
    isPay: true,
    price: 1280,
    memo: 'ランチ',
    recordType: RecordType.self,
    plannedRecordId: null,
    methodId: 3,
    methodName: '現金',
    methodColorClassificationName: 'grey',
    typeId: 7,
    typeName: '食費',
    subTypeId: 9,
    subTypeName: '外食',
    typeColorClassificationName: 'orange',
    isPair: false,
    pairUserName: null,
    isInstead: null,
    isSettlement: false,
    ...overrides
  };
}

describe('toRecordDefault', () => {
  it('一覧の行から編集の初期値を組む（日付は JST の暦日）', () => {
    expect(toRecordDefault(record())).toEqual({
      id: 1,
      isPay: true,
      date: '2026-09-25',
      methodId: 3,
      typeId: 7,
      subTypeId: 9,
      memo: 'ランチ',
      price: 1280,
      isInstead: false,
      isPair: false
    });
  });

  it('共有の立替は isInstead を保つ', () => {
    const result = toRecordDefault(
      record({ isPair: true, isInstead: true, recordType: RecordType.instead })
    );
    expect(result?.isInstead).toBe(true);
    expect(result?.isPair).toBe(true);
  });

  it('精算（isPay が null・カテゴリ無し）は編集対象にしない', () => {
    expect(
      toRecordDefault(
        record({
          isPay: null,
          typeId: null,
          recordType: RecordType.settlement,
          isSettlement: true
        })
      )
    ).toBeNull();
  });
});
