import { z } from 'zod';

// エンティティ ID（PK/FK）の共有フォームスキーマ（凍結資産）。
// 実 DB の連番 ID は正の整数だが、デモモードのモックデータは実データと決して
// 衝突しないよう負の ID を使う規約（bank 由来。更新系はデモで no-op のため
// 負 ID が DB に届くことはない）。
// そのため .positive() は使わず「0 のみ拒否」とする:
// - FormData の空文字は z.coerce.number() で 0 になるため、0 拒否が
//   「未選択・空入力」ガードを兼ねる（.positive() が担っていた役割）
// - 負 ID（デモ）と正 ID（実データ）はどちらも許容する
// ※ 色などマスタ選択の colorId は「未選択センチネル + 実マスタは常に正」のため
//   従来どおり .positive(メッセージ) を使ってよい（このスキーマの対象外）。
export function entityIdSchema(requiredError?: string) {
  return z.coerce
    .number({ error: requiredError })
    .int()
    .refine((value) => value !== 0, requiredError ?? 'ID が不正です');
}
