import type { TypeSummaryItem, TypeSummarySubItem } from '../types';

// get_type_summary の横長行（type × sub_type 展開・partition by types.id の sum を各行が持つ）を
// typeId ごとに畳み込んで TypeSummaryItem（subTypes 配列）へ整形する（旧 FE 整形踏襲）。
// server-only を含まない純粋関数 = Vitest 対象。

// 畳み込み入力（リポジトリの TypeSummaryRawRow と構造一致。domain を server から切り離すため
// ここで独立の入力型を定義し、repositories 側がこの形で渡す）。
export type TypeSummaryFoldRow = {
  typeId: number | null;
  typeName: string | null;
  isPair: boolean;
  subTypeId: number | null;
  subTypeName: string | null;
  colorName: string | null;
  subTypeSum: number;
  sum: number;
};

// typeId 単位で畳み込む。typeId=null（精算 record）は 1 グループにまとめる。
// - sum は行が持つ partition sum（同 typeId で同値）をそのまま採用。
// - subTypes は subTypeId/subTypeName/subTypeSum が揃い、かつ subTypeSum!==0 の行のみ
//   （旧 FE は sub_type_sum が truthy の行だけ nest する = 0 は落とす）。
// 入力は旧 SQL の order by sum desc 順で来る前提。畳み込み後もその出現順を保つ。
export function foldTypeSummary(rows: TypeSummaryFoldRow[]): TypeSummaryItem[] {
  const items: TypeSummaryItem[] = [];
  // typeId=null を含めてグループ化するため、キーは文字列化（'null' で 1 グループ）。
  const indexByKey = new Map<string, number>();

  for (const row of rows) {
    const key = String(row.typeId);
    let index = indexByKey.get(key);
    if (index === undefined) {
      index = items.length;
      indexByKey.set(key, index);
      items.push({
        typeId: row.typeId,
        typeName: row.typeName,
        isPair: row.isPair,
        colorName: row.colorName,
        sum: row.sum,
        subTypes: []
      });
    }
    // サブカテゴリ行（id/name/sum が揃い 0 でない）のみ nest する。
    if (
      row.subTypeId !== null &&
      row.subTypeName !== null &&
      row.subTypeSum !== 0
    ) {
      const sub: TypeSummarySubItem = {
        subTypeId: row.subTypeId,
        subTypeName: row.subTypeName,
        subTypeSum: row.subTypeSum
      };
      items[index].subTypes.push(sub);
    }
  }

  return items;
}
