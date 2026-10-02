import type { RecordsTarget } from './records-heading';

// 明細のクエリ文字列 → 絞り込み条件。純粋関数。
//
// クライアントが自由に付けられる値なので、数字に効くものはここで正規化する
// （id が不正なら null にして呼び出し側が 404 にする）。scope はリポジトリ層が
// 担保するので、正しい形の id を渡されても他人の記録は返らない。
// isPair と既定の年月はここでは決めず、呼び出し側から受け取る。

export type RecordsQuery = {
  axis?: string;
  id?: string;
  subTypeId?: string;
  subTypeName?: string;
  name?: string;
  color?: string;
  isPay?: string;
  instead?: string;
  ym?: string;
};

export type RecordsCondition = RecordsTarget & {
  id: number;
  subTypeId: number | null;
  yearMonth: string;
  colorName: string;
};

function positiveInt(value: string | undefined): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

// 'YYYY-MM' の形だけ受ける。
function yearMonthOr(value: string | undefined, fallback: string): string {
  return value !== undefined && /^\d{4}-\d{2}$/.test(value) ? value : fallback;
}

export function parseRecordsQuery(
  query: RecordsQuery,
  isPair: boolean,
  fallbackYearMonth: string
): RecordsCondition | null {
  const id = positiveInt(query.id);
  if (id === null) {
    return null;
  }

  const isType = query.axis !== 'method';
  // 方法軸にサブカテゴリは無い。
  const subTypeId = isType ? positiveInt(query.subTypeId) : null;

  return {
    isType,
    isPay: query.isPay !== '0',
    isPair,
    // 共有モードでは必ず立替を含める。内訳の集計（get_type_summary / get_method_summary）は
    // 共有モードのとき record_type in (5, 10) で立替を必ず数えるのに対し、明細
    // （get_summarized_record_list）は isIncludeInstead=false だと立替を落とすため、
    // false のまま渡すと明細の合計が内訳の金額と合わなくなる。
    isIncludeInstead: isPair ? true : query.instead !== '0',
    name: query.name ?? '',
    subTypeName: subTypeId === null ? null : (query.subTypeName ?? ''),
    id,
    subTypeId,
    yearMonth: yearMonthOr(query.ym, fallbackYearMonth),
    colorName: query.color ?? ''
  };
}
