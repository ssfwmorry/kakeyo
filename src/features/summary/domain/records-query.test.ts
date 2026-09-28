import { describe, expect, it } from 'vitest';
import { parseRecordsQuery } from './records-query';

describe('parseRecordsQuery', () => {
  it('id が無い・不正なら null（呼び出し側が 404 にする）', () => {
    expect(parseRecordsQuery({}, false)).toBeNull();
    expect(parseRecordsQuery({ id: '0' }, false)).toBeNull();
    expect(parseRecordsQuery({ id: '-3' }, false)).toBeNull();
    expect(parseRecordsQuery({ id: 'abc' }, false)).toBeNull();
    expect(parseRecordsQuery({ id: '1.5' }, false)).toBeNull();
  });

  it('既定はカテゴリ軸・支出・立替込み', () => {
    expect(parseRecordsQuery({ id: '7', ym: '2026-09' }, false)).toMatchObject({
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
      false
    );
    expect(result).toMatchObject({
      isType: false,
      subTypeId: null,
      subTypeName: null
    });
  });

  it('共有モードは必ず立替を含める（内訳の集計と合計を揃えるため）', () => {
    expect(parseRecordsQuery({ id: '7', instead: '0' }, true)).toMatchObject({
      isPair: true,
      isIncludeInstead: true
    });
    expect(parseRecordsQuery({ id: '7', instead: '1' }, true)).toMatchObject({
      isPair: true,
      isIncludeInstead: true
    });
  });

  it('年月が不正なら今月に落とす', () => {
    const result = parseRecordsQuery({ id: '7', ym: '2026-9' }, false);
    expect(result?.yearMonth).toMatch(/^\d{4}-\d{2}$/);
    expect(result?.yearMonth).not.toBe('2026-9');
  });

  it('サブカテゴリまで絞ると名前を持つ', () => {
    expect(
      parseRecordsQuery(
        { id: '7', subTypeId: '3', subTypeName: 'スーパー' },
        false
      )
    ).toMatchObject({ subTypeId: 3, subTypeName: 'スーパー' });
  });
});
