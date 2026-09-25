import { describe, expect, it } from 'vitest';
import { summarizeSubTypes } from './sub-type-summary';

describe('summarizeSubTypes', () => {
  it('0 件は「サブカテゴリなし」', () => {
    expect(summarizeSubTypes([])).toBe('サブカテゴリなし');
  });

  it('3 件までは全部並べる', () => {
    expect(summarizeSubTypes(['ランチ'])).toBe('ランチ');
    expect(summarizeSubTypes(['ランチ', 'ディナー', 'カフェ'])).toBe(
      'ランチ、ディナー、カフェ'
    );
  });

  it('4 件以上は先頭 2 件と残りの件数', () => {
    expect(
      summarizeSubTypes([
        'スーパー',
        'コンビニ',
        '飲み物',
        'お菓子',
        '米・パン'
      ])
    ).toBe('スーパー、コンビニ ほか3件');
  });
});
