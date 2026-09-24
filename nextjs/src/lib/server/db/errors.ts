import 'server-only';
import { Prisma } from '@/prisma/generated/client';

// Prisma のエラー分類ヘルパ（削除系サービスの共通述語）。
// 各 feature の service は自前の error union（'foreignKey' | ...）を持つため、
// ここでは「どの分類か」の判定のみを提供し、union への写像は呼び出し側に委ねる。

// FK 制約違反（P2003）か。関連データが残っている削除の失敗を判別する。
export function isForeignKeyError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2003'
  );
}
