import { describe, expect, it } from 'vitest';
import { RecordType } from '@/lib/shared/types/recordType';
import { isSettlementTarget, resolveRecordType } from './recordType';

describe('resolveRecordType', () => {
  it('非ペアは常に SELF（立替フラグは無視される）', () => {
    expect(resolveRecordType({ isPair: false, isInstead: false })).toBe(
      RecordType.self
    );
    expect(resolveRecordType({ isPair: false, isInstead: true })).toBe(
      RecordType.self
    );
  });

  it('ペア + 立替は INSTEAD', () => {
    expect(resolveRecordType({ isPair: true, isInstead: true })).toBe(
      RecordType.instead
    );
  });

  it('ペア + 非立替は PAIR', () => {
    expect(resolveRecordType({ isPair: true, isInstead: false })).toBe(
      RecordType.pair
    );
  });
});

describe('isSettlementTarget', () => {
  it('INSTEAD のみ精算対象', () => {
    expect(isSettlementTarget(RecordType.instead)).toBe(true);
    expect(isSettlementTarget(RecordType.self)).toBe(false);
    expect(isSettlementTarget(RecordType.pair)).toBe(false);
    expect(isSettlementTarget(RecordType.settlement)).toBe(false);
  });
});
