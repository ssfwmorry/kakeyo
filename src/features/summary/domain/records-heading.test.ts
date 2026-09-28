import { describe, expect, it } from 'vitest';
import { axisTag, recordsTitle, scopeTag } from './records-heading';

const base = {
  isType: true,
  isPay: true,
  isPair: false,
  isIncludeInstead: true,
  name: '食費',
  subTypeName: null
};

describe('recordsTitle', () => {
  it('サブカテゴリまで絞っていれば › で繋ぐ', () => {
    expect(recordsTitle({ ...base, subTypeName: 'スーパー' })).toBe(
      '食費 › スーパー'
    );
  });

  it('カテゴリだけなら名前そのまま', () => {
    expect(recordsTitle(base)).toBe('食費');
  });
});

describe('axisTag', () => {
  it('軸と支出収入で 4 通り', () => {
    expect(axisTag({ isType: true, isPay: true })).toBe('支出カテゴリ');
    expect(axisTag({ isType: true, isPay: false })).toBe('収入カテゴリ');
    expect(axisTag({ isType: false, isPay: true })).toBe('支払方法');
    expect(axisTag({ isType: false, isPay: false })).toBe('受取方法');
  });
});

describe('scopeTag', () => {
  it('共有は立替を区別しない', () => {
    expect(scopeTag({ isPair: true, isIncludeInstead: true })).toBe('共有');
    expect(scopeTag({ isPair: true, isIncludeInstead: false })).toBe('共有');
  });

  it('個人は立替の扱いを添える', () => {
    expect(scopeTag({ isPair: false, isIncludeInstead: true })).toBe(
      '個人 · 立替込み'
    );
    expect(scopeTag({ isPair: false, isIncludeInstead: false })).toBe(
      '個人 · 自分のみ'
    );
  });
});
