import { describe, expect, it } from 'vitest';
import {
  enumerateTargetYearMonths,
  isWithinMaterializeHorizon
} from './target-year-months';

// 対象年月の列挙と打ち切り（当月〜+7 ヶ月）の境界を固定する。

describe('enumerateTargetYearMonths', () => {
  it('当月から 7 ヶ月後まで 8 件を列挙する', () => {
    expect(enumerateTargetYearMonths('2026-01')).toEqual([
      '2026-01',
      '2026-02',
      '2026-03',
      '2026-04',
      '2026-05',
      '2026-06',
      '2026-07',
      '2026-08'
    ]);
  });

  it('年跨ぎ（12 月基準）を正しく繰り上げる', () => {
    expect(enumerateTargetYearMonths('2025-12')).toEqual([
      '2025-12',
      '2026-01',
      '2026-02',
      '2026-03',
      '2026-04',
      '2026-05',
      '2026-06',
      '2026-07'
    ]);
  });

  it('途中の年跨ぎ（9 月基準）も正しい', () => {
    expect(enumerateTargetYearMonths('2026-09', 4)).toEqual([
      '2026-09',
      '2026-10',
      '2026-11',
      '2026-12',
      '2027-01'
    ]);
  });

  it('monthsAhead=0 なら基準月のみ', () => {
    expect(enumerateTargetYearMonths('2026-05', 0)).toEqual(['2026-05']);
  });

  it('不正な年月は例外を投げる（黙って空にしない）', () => {
    expect(() => enumerateTargetYearMonths('2026-13')).toThrow();
    expect(() => enumerateTargetYearMonths('2026-1')).toThrow();
    expect(() => enumerateTargetYearMonths('202601')).toThrow();
  });
});

describe('isWithinMaterializeHorizon', () => {
  it('基準月と同じ月は対象', () => {
    expect(isWithinMaterializeHorizon('2026-10', '2026-10')).toBe(true);
  });

  it('7 ヶ月後ちょうどは対象、8 ヶ月後は対象外', () => {
    expect(isWithinMaterializeHorizon('2026-10', '2027-05')).toBe(true);
    expect(isWithinMaterializeHorizon('2026-10', '2027-06')).toBe(false);
  });

  it('年跨ぎの比較を正しく扱う', () => {
    expect(isWithinMaterializeHorizon('2026-12', '2027-07')).toBe(true);
    expect(isWithinMaterializeHorizon('2026-12', '2027-08')).toBe(false);
  });

  it('過去月は対象（SQL 側の datetime > now() で 0 件になる）', () => {
    expect(isWithinMaterializeHorizon('2026-10', '2020-01')).toBe(true);
  });

  it('不正な年月は例外を投げる', () => {
    expect(() => isWithinMaterializeHorizon('2026-10', '2026-13')).toThrow();
    expect(() => isWithinMaterializeHorizon('2026-1', '2026-10')).toThrow();
  });
});
