import { describe, expect, it } from 'vitest';
import type { PairedRecordItem } from '@/features/record';
import { RecordType } from '@/lib/shared/types/recordType';
import {
  buildRateGroups,
  openSum,
  settlementStatus,
  splitPairedRecords,
  toAssignments
} from './settlement-view';

function item(
  id: number,
  day: number,
  price: number,
  extra: Partial<PairedRecordItem> = {}
): PairedRecordItem {
  const isInstead = extra.recordType === undefined || extra.recordType === 5;
  return {
    id,
    datetime: new Date(Date.UTC(2026, 8, day, 3)),
    isSelf: true,
    isPay: true,
    price,
    memo: null,
    recordType: RecordType.instead,
    isSettled: false,
    isPlannedRecord: false,
    methodName: 'クレカ',
    methodColorClassificationName: 'blue',
    typeName: '食費',
    subTypeName: null,
    typeColorClassificationName: 'orange',
    isInstead,
    isSettlement: extra.recordType === RecordType.settlement,
    ...extra
  };
}

const shared = (id: number, day: number, price: number) =>
  item(id, day, price, {
    recordType: RecordType.pair,
    isSettled: null,
    isInstead: false
  });

describe('splitPairedRecords', () => {
  it('共有と精算は二人のお金、立替は自分と相手に分け、日付昇順に並べる', () => {
    const buckets = splitPairedRecords([
      item(3, 20, 500, { isSelf: false }),
      shared(2, 10, 3000),
      item(1, 5, 1000),
      item(4, 30, 2790, {
        recordType: RecordType.settlement,
        isSettled: null,
        isInstead: false
      })
    ]);
    expect(buckets.couple.map((r) => r.id)).toEqual([2, 4]);
    expect(buckets.mine.map((r) => r.id)).toEqual([1]);
    expect(buckets.partner.map((r) => r.id)).toEqual([3]);
  });
});

describe('openSum / settlementStatus', () => {
  it('未精算の立替だけを合計する', () => {
    expect(
      openSum([item(1, 1, 1000), item(2, 2, 500, { isSettled: true })])
    ).toBe(1000);
  });

  it('立替が無ければ none、未精算があれば open、全て済めば settled', () => {
    expect(settlementStatus(splitPairedRecords([shared(1, 1, 100)]))).toBe(
      'none'
    );
    expect(
      settlementStatus(
        splitPairedRecords([
          item(1, 1, 100),
          item(2, 2, 200, { isSettled: true })
        ])
      )
    ).toBe('open');
    expect(
      settlementStatus(
        splitPairedRecords([item(1, 1, 100, { isSettled: true })])
      )
    ).toBe('settled');
  });
});

describe('toAssignments / buildRateGroups', () => {
  it('割当のある未精算の立替だけを按分の入力にする', () => {
    const items = [
      item(1, 1, 1000),
      item(2, 2, 400, { isSelf: false }),
      item(3, 3, 900, { isSettled: true }),
      item(4, 4, 700)
    ];
    const rates = new Map([
      [1, 5],
      [2, 5],
      [3, 5]
    ]);
    expect(toAssignments(items, rates)).toEqual([
      { id: 1, price: 1000, isMe: true, rateIndex: 5 },
      { id: 2, price: 400, isMe: false, rateIndex: 5 }
    ]);
  });

  it('率ごとに集計し、チップに各 record の金額と立替者を持つ', () => {
    const groups = buildRateGroups([
      { id: 1, price: 1000, isMe: true, rateIndex: 5 },
      { id: 2, price: 400, isMe: false, rateIndex: 5 },
      { id: 3, price: 900, isMe: false, rateIndex: 0 }
    ]);
    expect(groups).toHaveLength(2);
    expect(groups[0]).toMatchObject({
      rateIndex: 0,
      sum: 900,
      asIs: 0,
      toBe: 900,
      diff: 900
    });
    expect(groups[1]).toMatchObject({
      rateIndex: 5,
      sum: 1400,
      asIs: 1000,
      toBe: 700,
      diff: -300
    });
    expect(groups[1].chips).toEqual([
      { id: 1, price: 1000, isMe: true },
      { id: 2, price: 400, isMe: false }
    ]);
  });
});
