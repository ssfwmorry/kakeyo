import { describe, expect, it } from 'vitest';
import type { SummarizedRecordItem } from '@/features/record';
import { RecordType } from '@/lib/shared/types/recordType';
import { groupRecordsByDay } from './records-group';

function item(
  id: number,
  datetime: string,
  price: number,
  extra: Partial<SummarizedRecordItem> = {}
): SummarizedRecordItem {
  return {
    id,
    isSelf: true,
    datetime: new Date(datetime),
    isPay: true,
    price,
    memo: null,
    recordType: RecordType.self,
    plannedRecordId: null,
    methodId: 1,
    methodName: 'クレカ',
    methodColorClassificationName: 'blue',
    typeId: 1,
    typeName: '食費',
    subTypeId: null,
    subTypeName: null,
    typeColorClassificationName: 'orange',
    isPair: false,
    pairUserName: null,
    isInstead: null,
    isScopeLocked: false,
    ...extra
  };
}

describe('groupRecordsByDay', () => {
  it('同じ日をまとめ、日計と総計を出す', () => {
    const result = groupRecordsByDay([
      item(1, '2026-09-25T12:00:00+09:00', 2480),
      item(2, '2026-09-21T12:00:00+09:00', 8640),
      item(3, '2026-09-21T09:00:00+09:00', 1320)
    ]);

    expect(result.days.map((d) => d.date)).toEqual([
      '2026-09-25',
      '2026-09-21'
    ]);
    expect(result.days[0].sum).toBe(2480);
    expect(result.days[1].sum).toBe(9960);
    expect(result.days[1].items).toHaveLength(2);
    expect(result.total).toBe(12440);
  });

  it('サービス層の並び（日時降順）をそのまま保つ', () => {
    const result = groupRecordsByDay([
      item(1, '2026-09-05T12:00:00+09:00', 100),
      item(2, '2026-09-25T12:00:00+09:00', 200)
    ]);
    // 並べ替えないので、渡された順に日が並ぶ。
    expect(result.days.map((d) => d.date)).toEqual([
      '2026-09-05',
      '2026-09-25'
    ]);
  });

  it('0 件なら空', () => {
    expect(groupRecordsByDay([])).toEqual({ days: [], total: 0 });
  });

  it('JST の日付で束ねる', () => {
    // UTC では 9/20 だが JST では 9/21。
    const result = groupRecordsByDay([
      item(1, '2026-09-20T16:00:00Z', 100),
      item(2, '2026-09-21T03:00:00Z', 200)
    ]);
    expect(result.days).toHaveLength(1);
    expect(result.days[0].date).toBe('2026-09-21');
  });
});
