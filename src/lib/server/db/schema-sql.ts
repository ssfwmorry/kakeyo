import 'server-only';
import { serverEnv } from '@/lib/server/env.server';
import { Prisma } from '@/prisma/generated/client';

// $queryRaw で生 SQL にスキーマ名（develop / public）を修飾するための共有ヘルパ。
// $queryRaw を使う全 feature（summary の集計・planned-record の実体化）が共通で使う。
//
// なぜ必要か: adapter-pg の { schema } オプションは Prisma ORM（findMany 等）には
//   効くが、$queryRaw の生 SQL のテーブル参照（"records" 等）には効かない。そのため
//   develop.records のようにスキーマ名を実行時に明示修飾する必要がある。
//
// develop 決め打ち禁止: 本番は public スキーマになりうる。環境変数
//   serverEnv.supabaseDatabaseSchema（= adapter-pg に渡す schema と同一）を正とする。
//
// SQL インジェクション対策: スキーマ名は Prisma.raw で SQL に直挿しするため、
//   ホワイトリスト（英数字と _ のみ、先頭は英字か _）で厳格に検証してから使う。
//   検証を通らなければ初回参照時に落とす。
const SCHEMA_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

function validatedSchemaName(): string {
  const name = serverEnv.supabaseDatabaseSchema;
  if (!SCHEMA_NAME_PATTERN.test(name)) {
    throw new Error(
      `Invalid SUPABASE_DATABASE_SCHEMA for raw SQL: ${JSON.stringify(name)}`
    );
  }
  return name;
}

// `develop.` のようなスキーマ修飾子（末尾ドット付き）を Prisma.raw で返す。
// 使い方: prisma.$queryRaw`select ... from ${schemaSql()}records left join ${schemaSql()}pairs ...`
export function schemaSql(): Prisma.Sql {
  return Prisma.raw(`${validatedSchemaName()}.`);
}
