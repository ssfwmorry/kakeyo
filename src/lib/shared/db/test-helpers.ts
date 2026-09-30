import type { SQL } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';

const dialect = new PgDialect();

// 条件式を SQL 文字列とバインド値に展開する（テスト用）。
export function toSql(condition: SQL): { sql: string; params: unknown[] } {
  const query = dialect.sqlToQuery(condition);
  return { sql: query.sql, params: query.params };
}
