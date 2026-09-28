import { describe, expect, it } from 'vitest';
import type { RecordListItem } from '@/features/record';
import { RecordType } from '@/lib/shared/types/recordType';
import type { DaySum } from '../types';
import { buildDaySumList, sumMonthFromDays } from './day-sum';

function day(dateStr: string, sum: number): DaySum {
  return { dateStr, sum, records: [], holidayName: null };
}

// 自分の支出 record（datetime は JST 暦日の 0 時）。
function record(id: number, dateStr: string, price: number): RecordListItem {
  return {
    id,
    isSelf: true,
    datetime: new Date(`${dateStr}T00:00:00+09:00`),
    isPay: true,
    price,
    memo: null,
    recordType: RecordType.self,
    plannedRecordId: null,
    methodId: 1,
    methodName: '現金',
    methodColorClassificationName: 'grey',
    typeId: 1,
    typeName: '食費',
    subTypeId: null,
    subTypeName: null,
    typeColorClassificationName: 'red',
    isPair: false,
    pairUserName: null,
    isInstead: null,
    isSettlement: null
  };
}

describe('buildDaySumList', () => {
  const range = { startStr: '2026-09-20', endStr: '2026-09-24' };

  it('表示範囲の全日を作り、記録の無い日も records=[] / sum=0 で持つ', () => {
    const days = buildDaySumList([record(1, '2026-09-22', 480)], range);
    expect(days.map((d) => d.dateStr)).toEqual([
      '2026-09-20',
      '2026-09-21',
      '2026-09-22',
      '2026-09-23',
      '2026-09-24'
    ]);
    expect(days[2].sum).toBe(480);
    expect(days[2].records).toHaveLength(1);
    expect(days[1].sum).toBe(0);
    expect(days[1].records).toEqual([]);
  });

  it('記録の無い祝日にも祝日名が付く', () => {
    const days = buildDaySumList([], range);
    const byDate = Object.fromEntries(
      days.map((d) => [d.dateStr, d.holidayName])
    );
    // 2026-09-21 敬老の日 / 09-22 国民の休日 / 09-23 秋分の日。
    expect(byDate['2026-09-21']).toBe('敬老の日');
    expect(byDate['2026-09-22']).toBe('国民の休日');
    expect(byDate['2026-09-23']).toBe('秋分の日');
    expect(byDate['2026-09-24']).toBeNull();
  });

  it('範囲外の日付の記録も落とさず末尾に並ぶ', () => {
    const days = buildDaySumList([record(1, '2026-09-30', 100)], range);
    expect(days.at(-1)?.dateStr).toBe('2026-09-30');
    expect(days).toHaveLength(6);
  });
});

describe('sumMonthFromDays', () => {
  it('対象月の日別収支だけを足し上げる（前後月は除く）', () => {
    const days = [
      day('2026-08-31', 999),
      day('2026-09-01', 81200),
      day('2026-09-25', -250000),
      day('2026-10-01', 500)
    ];
    expect(sumMonthFromDays(days, '2026-09')).toBe(81200 - 250000);
  });

  it('対象月に記録が無ければ 0', () => {
    expect(sumMonthFromDays([day('2026-08-31', 100)], '2026-09')).toBe(0);
  });
});
