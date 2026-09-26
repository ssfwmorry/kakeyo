import 'server-only';

// dataset のテーブル定義ヘルパ。
// デモデータは「実 DB のテーブル構成を写した小さな DB」として持つ。各テーブルはキー付きの
// 行として宣言し、id は宣言順に 1 から自動採番する。他テーブルからの参照は
// `types.food.id` のようにキー経由で書き、id や名前を手で複製しない
// （参照先の追加・並べ替えで id がずれても、参照は追従する）。

export type WithId<R> = R & { id: number };

type Keyed<T> = { [K in keyof T]: WithId<T[K]> };

// キー付きの行定義に宣言順で id を振り、[キー → 行, 行配列] を返す。
//   const [types, typeRows] = defineTable({ food: {...}, daily: {...} });
//   types.food.id   // 1
//   typeRows        // [{ id: 1, ... }, { id: 2, ... }]
export function defineTable<T extends Record<string, object>>(
  seed: T
): [Keyed<T>, WithId<T[keyof T]>[]] {
  const keyed = {} as Keyed<T>;
  const rows: WithId<T[keyof T]>[] = [];
  for (const key of Object.keys(seed) as (keyof T)[]) {
    const row = { ...seed[key], id: rows.length + 1 } as WithId<T[keyof T]>;
    keyed[key] = row as Keyed<T>[keyof T];
    rows.push(row);
  }
  return [keyed, rows];
}

// id で 1 行を引く索引を作る。参照整合は dataset.test.ts が保証するため、見つからないのは
// dataset の記述ミス = 起動時に気付くべき不整合として例外にする。
export function indexById<R extends { id: number }>(
  tableName: string,
  rows: R[]
): (id: number) => R {
  const byId = new Map(rows.map((row) => [row.id, row]));
  return (id) => {
    const row = byId.get(id);
    if (!row) {
      throw new Error(
        `demo dataset: ${tableName} に id=${id} の行がありません`
      );
    }
    return row;
  };
}
