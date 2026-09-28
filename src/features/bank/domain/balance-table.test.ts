import { describe, expect, it } from 'vitest';
import { type BankColumn, buildBalanceTable } from './balance-table';

// bank 残高テーブルの合計補完ロジックの Vitest。
// server-only を含まない純粋関数のみ対象。

const banks: BankColumn[] = [
  { id: 1, name: '銀行A' },
  { id: 2, name: '銀行B' }
];

// created_at は JST 日付境界に丸められる。ここでは JST の暦日が変わらない時刻を使う。
const day1 = '2026-01-10T00:00:00+09:00';
const day2 = '2026-02-10T00:00:00+09:00';
const day3 = '2026-03-10T00:00:00+09:00';

describe('buildBalanceTable', () => {
  it('(a) 全口座に値がある行は全て採用し合計する', () => {
    const rows = buildBalanceTable(banks, [
      { createdAt: day1, prices: { '1': 1000, '2': 2000 } }
    ]);
    expect(rows).toEqual([
      { createdDate: '2026-01-10', bankPrices: [1000, 2000], sum: 3000 }
    ]);
  });

  it('(b) 一部欠損は前行の同口座値を引き継ぎ合計へ含める', () => {
    const rows = buildBalanceTable(banks, [
      { createdAt: day1, prices: { '1': 1000, '2': 2000 } },
      // 2 行目は銀行B のみ更新 → 銀行A は前行 1000 を引き継ぐ。
      { createdAt: day2, prices: { '2': 5000 } }
    ]);
    expect(rows[1]).toEqual({
      createdDate: '2026-02-10',
      bankPrices: [1000, 5000],
      sum: 6000
    });
  });

  it('(c) 初回行で欠損している口座は null（引き継ぐ前行が無い）', () => {
    const rows = buildBalanceTable(banks, [
      { createdAt: day1, prices: { '1': 1000 } }
    ]);
    expect(rows[0]).toEqual({
      createdDate: '2026-01-10',
      bankPrices: [1000, null],
      sum: 1000
    });
  });

  it('(d) 前行も null の口座は引き継がず null のまま', () => {
    const rows = buildBalanceTable(banks, [
      // 初回で銀行B が null。
      { createdAt: day1, prices: { '1': 1000 } },
      // 2 行目でも銀行B の登録が無い → 前行も null なので null のまま。
      { createdAt: day2, prices: { '1': 1500 } }
    ]);
    expect(rows[1]).toEqual({
      createdDate: '2026-02-10',
      bankPrices: [1500, null],
      sum: 1500
    });
  });

  it('(e) 全口座 null（初回に何も無い）行は sum を null にする', () => {
    const rows = buildBalanceTable(banks, [{ createdAt: day1, prices: {} }]);
    expect(rows[0]).toEqual({
      createdDate: '2026-01-10',
      bankPrices: [null, null],
      sum: null
    });
  });

  it('(b+d 複合) 3 行に渡る前行引き継ぎが正しく連鎖する', () => {
    const rows = buildBalanceTable(banks, [
      { createdAt: day1, prices: { '1': 1000, '2': 2000 } },
      { createdAt: day2, prices: {} }, // 両方前行引き継ぎ → 1000/2000
      { createdAt: day3, prices: { '1': 9999 } } // A更新, B は day2 経由で 2000 引き継ぎ
    ]);
    expect(rows[1]).toEqual({
      createdDate: '2026-02-10',
      bankPrices: [1000, 2000],
      sum: 3000
    });
    expect(rows[2]).toEqual({
      createdDate: '2026-03-10',
      bankPrices: [9999, 2000],
      sum: 11999
    });
  });
});
