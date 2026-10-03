import { describe, expect, it } from 'vitest';
import { buildBalanceBars } from './balance-bars';

const banks = [
  { id: 1, colorName: 'blue' },
  { id: 2, colorName: 'green' }
];
const toColor = (name: string) => `c:${name}`;

function bucket(key: string, prices: (number | null)[]) {
  return { key, label: '', prices };
}

describe('buildBalanceBars', () => {
  it('口座を下から積み、合計の最大を 150px にする', () => {
    const { bars, zeroTop } = buildBalanceBars(
      [bucket('a', [60, 40]), bucket('b', [25, 25])],
      banks,
      toColor
    );
    expect(zeroTop).toBe(155);
    expect(bars[0]).toMatchObject({
      key: 'a',
      top: 5,
      height: 150,
      value: 100
    });
    expect(bars[0].segments).toEqual([
      { key: '1', height: 90, color: 'c:blue' },
      { key: '2', height: 60, color: 'c:green' }
    ]);
    expect(bars[1]).toMatchObject({ height: 75, value: 50 });
  });

  it('未登録（null）と空の区間は 0 として高さを持たない', () => {
    const { bars } = buildBalanceBars(
      [bucket('a', []), bucket('b', [null, 30])],
      banks,
      toColor
    );
    expect(bars[0]).toMatchObject({ height: 0, value: 0 });
    expect(bars[1].segments.map((segment) => segment.height)).toEqual([0, 150]);
  });
});
