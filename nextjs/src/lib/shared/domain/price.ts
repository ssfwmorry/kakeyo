import { z } from 'zod';

// 金額（price: Int）の共有パーススキーマ（凍結資産・ドメイン計算の単一の正）。
// 家計の数字の入口。record / planned_record / short_cut / bank_balance など
// 金額を持つ全レーンは、素の Number() を使わず必ずこのスキーマを経由する。
//
// FormData はすべて文字列で届くため、"1,000"（カンマ）・全角数字（"１０００"）・
// 前後空白・空文字を素直に Number() すると NaN / 0 が混入し家計がズレる。
// そこで前処理で「全角→半角・カンマ/空白除去」を施したうえで、
// z.coerce.number().int().nonnegative() で整数・非負を保証する。

// 金額の上限。テンキー入力の桁上げ抑止と priceSchema の上限判定に使い、金額を持つ
// 全レーンへ一括で効かせる。「未満」判定なので実質上限は 9,999,999 円（10,000,000 は不可）。
export const MAX_PRICE = 10_000_000;

// 全角数字（U+FF10〜U+FF19）を半角へ寄せ、桁区切りカンマ（半角/全角）と空白を除去する。
// 通貨記号やマイナスなど想定外の文字はここで落とさず、後段の数値検証に委ねて
// 「不正な入力はエラーにする」（勝手に 0 に丸めない）。
function normalizePriceInput(raw: string): string {
  return raw
    .replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .replace(/[,，\s]/g, '');
}

// 金額の共有スキーマ。入力は string（FormData 由来）または number を許容する。
// - 空文字 / 空白のみ → 必須エラー
// - 全角・カンマ入り → 正規化して数値化
// - 小数 / 負数 / 数値以外 → エラー（円単位の非負整数のみ許容）
export const priceSchema = z
  .union([z.string(), z.number()])
  .transform((value, ctx) => {
    if (typeof value === 'number') {
      return value;
    }
    const normalized = normalizePriceInput(value);
    if (normalized === '') {
      ctx.addIssue({ code: 'custom', message: '金額を入力してください' });
      return z.NEVER;
    }
    const parsed = Number(normalized);
    if (!Number.isFinite(parsed)) {
      ctx.addIssue({ code: 'custom', message: '金額は数値で入力してください' });
      return z.NEVER;
    }
    return parsed;
  })
  .pipe(
    z
      .number()
      .int('金額は整数で入力してください')
      .nonnegative('金額は 0 以上で入力してください')
      // MAX_PRICE 未満（上限は 9,999,999 円）。
      .lt(MAX_PRICE, '金額が大きすぎます')
  );

// スキーマ外から直接パースしたい場合の薄いヘルパ（成否を判別可能な形で返す）。
// フォーム内では priceSchema を Conform の schema に組み込んで使うのが基本。
export function parsePrice(
  input: string | number
): { ok: true; value: number } | { ok: false; message: string } {
  const result = priceSchema.safeParse(input);
  if (result.success) {
    return { ok: true, value: result.data };
  }
  return {
    ok: false,
    message: result.error.issues[0]?.message ?? '金額が不正です'
  };
}
