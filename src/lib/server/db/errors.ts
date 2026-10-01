import 'server-only';

// DB エラー分類ヘルパ（削除系サービスの共通述語）。
// 各 feature の service は自前の error union（'foreignKey' | ...）を持つため、
// ここでは「どの分類か」の判定のみを提供し、union への写像は呼び出し側に委ねる。

// PostgreSQL の foreign_key_violation。
const FK_VIOLATION_CODE = '23503';

// FK 制約違反か。関連データが残っている削除の失敗を判別する。
export function isForeignKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === FK_VIOLATION_CODE
  );
}
