import { describe, expect, it } from 'vitest';
import { parseRecordsQuery } from './records-query';

describe('parseRecordsQuery', () => {
  it('id が無い・不正なら null（呼び出し側が 404 にする）', () => {
    expect(parseRecordsQuery({}, false, '2026-10')).toBeNull();
    expect(parseRecordsQuery({ id: '0' }, false, '2026-10')).toBeNull();
    expect(parseRecordsQuery({ id: '-3' }, false, '2026-10')).toBeNull();
    expect(parseRecordsQuery({ id: 'abc' }, false, '2026-10')).toBeNull();
    expect(parseRecordsQuery({ id: '1.5' }, false, '2026-10')).toBeNull();
  });

  it('既定はカテゴリ軸・支出・立替込み', () => {
    expect(
      parseRecordsQuery({ id: '7', ym: '2026-09' }, false, '2026-10')
    ).toMatchObject({
      id: 7,
      isType: true,
      isPay: true,
      isIncludeInstead: true,
      subTypeId: null
    });
  });

  it('方法軸ではサブカテゴリを捨てる', () => {
    const result = parseRecordsQuery(
      { id: '7', axis: 'method', subTypeId: '3', subTypeName: 'スーパー' },
      false,
      '2026-10'
    );
    expect(result).toMatchObject({
      isType: false,
      subTypeId: null,
      subTypeName: null
    });
  });

  it('共有モードは必ず立替を含める（内訳の集計と合計を揃えるため）', () => {
    expect(
      parseRecordsQuery({ id: '7', instead: '0' }, true, '2026-10')
    ).toMatchObject({
      isPair: true,
      isIncludeInstead: true
    });
    expect(
      parseRecordsQuery({ id: '7', instead: '1' }, true, '2026-10')
    ).toMatchObject({
      isPair: true,
      isIncludeInstead: true
    });
  });

  it('年月が不正なら既定の年月に落とす', () => {
    const result = parseRecordsQuery(
      { id: '7', ym: '2026-9' },
      false,
      '2026-10'
    );
    expect(result?.yearMonth).toBe('2026-10');
  });

  it('サブカテゴリまで絞ると名前を持つ', () => {
    expect(
      parseRecordsQuery(
        { id: '7', subTypeId: '3', subTypeName: 'スーパー' },
        false,
        '2026-10'
      )
    ).toMatchObject({ subTypeId: 3, subTypeName: 'スーパー' });
  });
});
