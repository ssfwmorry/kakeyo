import { z } from 'zod';

// エンティティ ID（PK/FK）の共有フォームスキーマ（凍結資産）。
// 検証は「整数かつ 0 でない」のみ:
// - FormData の空文字は z.coerce.number() で 0 になるため、0 拒否が
//   「未選択・空入力」ガードを兼ねる
// - 実 DB の連番 ID もデモのモック ID も正の整数（デモは取得=モック / 更新=no-op で
//   DB に届かないため、実データと同じ正の連番でも衝突しない）
// ※ 色などマスタ選択の colorId は「未選択センチネル + 実マスタは常に正」のため
//   従来どおり .positive(メッセージ) を使ってよい（このスキーマの対象外）。
export function entityIdSchema(requiredError?: string) {
  return z.coerce
    .number({ error: requiredError })
    .int()
    .refine((value) => value !== 0, requiredError ?? 'ID が不正です');
}
