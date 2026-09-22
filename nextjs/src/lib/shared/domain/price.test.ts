import { describe, expect, it } from 'vitest';
import { parsePrice, priceSchema } from './price';

describe('priceSchema', () => {
  it('半角の整数文字列をそのまま数値化する', () => {
    expect(priceSchema.parse('1000')).toBe(1000);
    expect(priceSchema.parse('0')).toBe(0);
  });

  it('カンマ区切りを除去して数値化する', () => {
    expect(priceSchema.parse('1,000')).toBe(1000);
    expect(priceSchema.parse('1,234,567')).toBe(1234567);
  });

  it('全角数字を半角へ寄せて数値化する', () => {
    expect(priceSchema.parse('１０００')).toBe(1000);
    expect(priceSchema.parse('１，２３４')).toBe(1234);
  });

  it('前後の空白を無視する', () => {
    expect(priceSchema.parse('  1000 ')).toBe(1000);
  });

  it('number をそのまま受け取る', () => {
    expect(priceSchema.parse(500)).toBe(500);
  });

  it('空文字・空白のみは必須エラー', () => {
    expect(priceSchema.safeParse('').success).toBe(false);
    expect(priceSchema.safeParse('   ').success).toBe(false);
  });

  it('数値以外はエラー（勝手に 0 に丸めない）', () => {
    expect(priceSchema.safeParse('abc').success).toBe(false);
    expect(priceSchema.safeParse('1000円').success).toBe(false);
  });

  it('小数はエラー（円単位の整数のみ）', () => {
    expect(priceSchema.safeParse('100.5').success).toBe(false);
  });

  it('負数はエラー（非負のみ）', () => {
    expect(priceSchema.safeParse('-100').success).toBe(false);
    expect(priceSchema.safeParse(-1).success).toBe(false);
  });

  it('上限は 1000 万円未満（旧 MAX_PRICE 準拠）', () => {
    // 9,999,999 円までは許容、10,000,000 円ちょうどは不可（「未満」判定）。
    expect(priceSchema.parse('9999999')).toBe(9999999);
    expect(priceSchema.parse(9_999_999)).toBe(9_999_999);
    expect(priceSchema.safeParse('10000000').success).toBe(false);
    expect(priceSchema.safeParse(10_000_000).success).toBe(false);
    expect(priceSchema.safeParse(10_000_001).success).toBe(false);
  });
});

describe('parsePrice', () => {
  it('成功時は value を返す', () => {
    expect(parsePrice('1,000')).toEqual({ ok: true, value: 1000 });
  });

  it('失敗時は ok:false とメッセージを返す', () => {
    const result = parsePrice('');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toBe('金額を入力してください');
    }
  });
});
