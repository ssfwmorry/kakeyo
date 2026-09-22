import { describe, expect, it } from 'vitest';
import {
  fromRecordsSearchParams,
  type RecordsQuery,
  toRecordsSearchParams
} from './records-query';

// RECORDS_QUERY_PARAM 相当の URL クエリ往復の Vitest。

const base: RecordsQuery = {
  id: 42,
  subTypeId: 7,
  isPay: true,
  isType: true,
  isPair: false,
  isIncludeInstead: false,
  yearMonth: '2026-09',
  name: '食費 - 外食',
  colorName: 'orange',
  pairUserName: null
};

describe('records-query round-trip', () => {
  it('to→from で元に戻る', () => {
    const params = toRecordsSearchParams(base);
    const parsed = fromRecordsSearchParams(
      Object.fromEntries(params.entries())
    );
    expect(parsed).toEqual(base);
  });

  it('subTypeId null / pairUserName あり', () => {
    const q: RecordsQuery = {
      ...base,
      subTypeId: null,
      isType: false,
      pairUserName: '相手'
    };
    const params = toRecordsSearchParams(q);
    const parsed = fromRecordsSearchParams(
      Object.fromEntries(params.entries())
    );
    expect(parsed).toEqual(q);
  });

  it('必須（id / yearMonth）欠落は null', () => {
    expect(fromRecordsSearchParams({})).toBeNull();
    expect(fromRecordsSearchParams({ id: '1' })).toBeNull();
    expect(
      fromRecordsSearchParams({ id: 'abc', yearMonth: '2026-09' })
    ).toBeNull();
    expect(fromRecordsSearchParams({ id: '1', yearMonth: 'bad' })).toBeNull();
  });
});
