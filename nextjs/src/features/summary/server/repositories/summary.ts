import 'server-only';
import { prisma } from '@/lib/server/db/client';
import type { SessionScope } from '@/lib/shared/types/auth';
import type { PieSummaryQuery, TypeSummaryPeriodQuery } from '../../types';
import { schemaSql } from '../schema-sql';

// L6 summary レーンのリポジトリ層（server-only）。
//
// ★方針: 集計 6 本は docs/database/functions.md の RPC を「そのまま」$queryRaw で
//   移植する（record_type 0/5/10/15 分岐・is_pay・精算/立替の非対称処理の CASE WHEN を
//   一切改変しない = 家計の数字ズレを防ぐ最重要ポイント）。ORM に翻訳しない。
//
// ★スキーマ修飾: adapter-pg の { schema } は $queryRaw の生 SQL に効かないため
//   ${schemaSql()} で develop. / public. を実行時スキーマ名で明示修飾する。
//
// ★scope: 旧 SQL の
//     records.user_id = input_user_id
//     OR pairs.user1_id = input_user_id
//     OR pairs.user2_id = input_user_id
//   を維持する（pairs を left join した 3-way OR）。input_user_id には
//   scope.userUid をテンプレート変数（= バインドパラメータ・SQL インジェクション安全）
//   で渡す。buildScopeWhere（ORM 用）は使わず、旧 RPC と同一の WHERE を保つ。
//
// ★数値境界: 集計 sum は $queryRaw では bigint/Decimal で返りうるため、
//   境界で Number() 変換して number にする（BigInt を Server→Client に漏らさない）。

// $queryRaw の bigint/Decimal/number を安全に number へ寄せる。
function toNumber(
  value: bigint | number | { toString(): string } | null
): number {
  if (value === null) {
    return 0;
  }
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'bigint') {
    return Number(value);
  }
  return Number(value.toString());
}

// null 許容の int 列（type_id / sub_type_id 等）。null はそのまま保持する。
function toNullableNumber(
  value: bigint | number | { toString(): string } | null
): number | null {
  if (value === null) {
    return null;
  }
  return toNumber(value);
}

// ============================================================
// func_get_month_sum（月の self_sum）
// ============================================================

type MonthSumRawRow = {
  year_month: string;
  self_sum: bigint | number | null;
};

// 月毎の収支集計（self_sum）。旧 func_get_month_sum を移植。
// 正の値は「収支がマイナス（支出超過）」を意味する（旧仕様）。
export async function getMonthSum(
  scope: SessionScope,
  yearMonth: string
): Promise<number> {
  const rows = await prisma.$queryRaw<MonthSumRawRow[]>`
    with converted_price as (
      select
        to_char(cast(datetime as date),'YYYY-MM') as year_month,
        case
          when records.record_type = 0 and records.user_id = ${scope.userUid} then
            case
              when is_pay = false then price * (-1)
              else price
            end
          when records.record_type = 5 and records.user_id = ${scope.userUid} then price
          when records.record_type = 15 and records.user_id = ${scope.userUid} then price
          when records.record_type = 15 and records.user_id <> ${scope.userUid} then price * (-1)
          else 0
        end as self_price
      from ${schemaSql()}records
      left join ${schemaSql()}pairs on
        records.pair_id = pairs.id
      where
        (
          records.user_id = ${scope.userUid}
          or pairs.user1_id = ${scope.userUid}
          or pairs.user2_id = ${scope.userUid}
        )
        and to_char(cast(datetime as date),'YYYY-MM') = ${yearMonth}
    )
    select
      year_month,
      sum(self_price) as self_sum
    from converted_price
    group by year_month
  `;
  if (rows.length === 0) {
    return 0;
  }
  return toNumber(rows[0].self_sum);
}

// ============================================================
// func_get_method_summary（方法別集計）
// ============================================================

// リポジトリの公開行は Number() 変換後の形（id/sum は number）。
export type MethodSummaryRawRow = {
  method_name: string;
  method_id: number;
  pair_user_name: string | null;
  color_name: string;
  is_pair: boolean;
  sum: number;
};

// year/month を PieSummaryQuery の yearMonth（'YYYY-MM'）から取り出す。
// 旧 RPC は input_year / input_month を別引数で受け、内部で `year || '-' || month`
// に組み立てて to_char 比較する。ここでは分解して同じ文字列比較を再現する。
function splitYearMonth(yearMonth: string): { year: string; month: string } {
  const [year, month] = yearMonth.split('-');
  return { year, month };
}

// 方法別の月次集計。旧 func_get_method_summary を移植。
export async function getMethodSummaryRows(
  scope: SessionScope,
  query: PieSummaryQuery
): Promise<MethodSummaryRawRow[]> {
  const { year, month } = splitYearMonth(query.yearMonth);
  const rows = await prisma.$queryRaw<
    Array<
      Omit<MethodSummaryRawRow, 'method_id'> & { method_id: bigint | number }
    >
  >`
    with summarized_records as (
      select distinct
        records.method_id,
        sum(records.price) as sum
      from ${schemaSql()}records
      left join ${schemaSql()}pairs on
        records.pair_id = pairs.id
      where
        ( records.user_id = ${scope.userUid}
          or pairs.user1_id = ${scope.userUid}
          or pairs.user2_id = ${scope.userUid}
        )
        and (case
          when ${query.isPair}::boolean = true then record_type in (5, 10)
          when ${query.isPair}::boolean = false and ${query.isIncludeInstead}::boolean = true
            then (record_type in (0, 15) or ( record_type = 5 and (user_id = ${scope.userUid}) ))
          when ${query.isPair}::boolean = false and ${query.isIncludeInstead}::boolean = false then record_type = 0
          else true
        end)
        and (case
          when record_type = 15 and ${query.isPay}::boolean = true then (user_id = ${scope.userUid})
          when record_type = 15 and ${query.isPay}::boolean = false then (user_id <> ${scope.userUid})
          else is_pay = ${query.isPay}::boolean
        end)
        and to_char(cast(datetime as date),'YYYY-MM') = ${`${year}-${month}`}
      group by method_id
    )
    select
      methods.name as method_name,
      methods.id as method_id,
      users.name as pair_user_name,
      color_classifications.name as color_name,
      methods.pair_id is not null as is_pair,
      summarized_records.sum
    from summarized_records
    inner join ${schemaSql()}methods on
      summarized_records.method_id = methods.id
    inner join ${schemaSql()}color_classifications on
      methods.color_classification_id = color_classifications.id
    left join ${schemaSql()}pairs on
      methods.pair_id = pairs.id
    left join ${schemaSql()}users on
      methods.user_id = users.uid
    order by summarized_records.sum desc
  `;
  return rows.map((row) => ({
    method_name: row.method_name,
    method_id: toNumber(row.method_id),
    pair_user_name: row.pair_user_name,
    color_name: row.color_name,
    is_pair: row.is_pair,
    sum: toNumber(row.sum)
  }));
}

// ============================================================
// func_get_type_summary（カテゴリ別集計・sub_type 横長行）
// ============================================================

// 旧 RPC の 1 行（type × sub_type の展開行。partition by types.id の sum を各行が持つ）。
export type TypeSummaryRawRow = {
  type_name: string | null;
  type_id: number | null;
  is_pair: boolean;
  sub_type_id: number | null;
  sub_type_name: string | null;
  color_name: string | null;
  sub_type_sum: number;
  sum: number;
};

// カテゴリ別の月次集計（横長行のまま返す。TS 側で TypeSummaryItem に畳み込む）。
// 旧 func_get_type_summary を移植。
export async function getTypeSummaryRows(
  scope: SessionScope,
  query: PieSummaryQuery
): Promise<TypeSummaryRawRow[]> {
  const { year, month } = splitYearMonth(query.yearMonth);
  const rows = await prisma.$queryRaw<
    Array<{
      type_name: string | null;
      type_id: bigint | number | null;
      is_pair: boolean;
      sub_type_id: bigint | number | null;
      sub_type_name: string | null;
      color_name: string | null;
      sub_type_sum: bigint | number | null;
      sum: bigint | number | null;
    }>
  >`
    with summarized_records as (
      select distinct
        records.type_id,
        records.sub_type_id,
        sum(records.price) as sum
      from ${schemaSql()}records
      left join ${schemaSql()}pairs on
        records.pair_id = pairs.id
      where
        ( records.user_id = ${scope.userUid}
          or pairs.user1_id = ${scope.userUid}
          or pairs.user2_id = ${scope.userUid}
        )
        and (case
          when ${query.isPair}::boolean = true then record_type in (5, 10)
          when ${query.isPair}::boolean = false and ${query.isIncludeInstead}::boolean = true
            then (record_type in (0, 15) or ( record_type = 5 and (user_id = ${scope.userUid}) ))
          when ${query.isPair}::boolean = false and ${query.isIncludeInstead}::boolean = false then record_type = 0
          else true
        end)
        and (case
          when record_type = 15 and ${query.isPay}::boolean = true then (user_id = ${scope.userUid})
          when record_type = 15 and ${query.isPay}::boolean = false then (user_id <> ${scope.userUid})
          else is_pay = ${query.isPay}::boolean
        end)
        and to_char(cast(datetime as date),'YYYY-MM') = ${`${year}-${month}`}
      group by type_id, sub_type_id
      order by type_id
    )
    select
      types.name as type_name,
      types.id as type_id,
      case
        when types.id is null then true
        else types.pair_id is not null
      end as is_pair,
      sub_types.id as sub_type_id,
      sub_types.name as sub_type_name,
      color_classifications.name as color_name,
      summarized_records.sum as sub_type_sum,
      cast( sum(summarized_records.sum) over (partition by types.id) as integer) as sum
    from summarized_records
    left join ${schemaSql()}types on
      summarized_records.type_id = types.id
    left join ${schemaSql()}color_classifications on
      types.color_classification_id = color_classifications.id
    left join ${schemaSql()}sub_types on
      summarized_records.sub_type_id = sub_types.id
    order by sum desc
  `;
  return rows.map((row) => ({
    type_name: row.type_name,
    type_id: toNullableNumber(row.type_id),
    is_pair: row.is_pair,
    sub_type_id: toNullableNumber(row.sub_type_id),
    sub_type_name: row.sub_type_name,
    color_name: row.color_name,
    sub_type_sum: toNumber(row.sub_type_sum),
    sum: toNumber(row.sum)
  }));
}

// ============================================================
// func_get_pay_and_income_list（年次 月別 支出/収入）
// ============================================================

export type PayAndIncomeRawRow = {
  year_month: string;
  pay_sum: number;
  income_sum: number;
};

// 年次の月別 支出/収入。旧 func_get_pay_and_income_list を移植。
// input_is_pair / input_is_include_instead は PieSummaryQuery と同じ意味で受ける。
export async function getPayAndIncomeRows(
  scope: SessionScope,
  input: { year: number; isPair: boolean; isIncludeInstead: boolean }
): Promise<PayAndIncomeRawRow[]> {
  const yearStr = String(input.year);
  const rows = await prisma.$queryRaw<
    Array<{
      year_month: string;
      pay_sum: bigint | number | null;
      income_sum: bigint | number | null;
    }>
  >`
    with converted_price as (
      select
        case
          when record_type = 15 and user_id = ${scope.userUid} then price
          when record_type = 15 and user_id <> ${scope.userUid} then 0
          when is_pay = true then price
          else 0
        end as pay_price,
        case
          when record_type = 15 and user_id = ${scope.userUid} then 0
          when record_type = 15 and user_id <> ${scope.userUid} then price
          when is_pay = false then price
          else 0
        end as income_price,
        to_char(cast(datetime as date),'YYYY-MM') as year_month
      from ${schemaSql()}records
      left join ${schemaSql()}pairs on
        records.pair_id = pairs.id
      where
        ( records.user_id = ${scope.userUid}
          or pairs.user1_id = ${scope.userUid}
          or pairs.user2_id = ${scope.userUid}
        )
        and (case
          when ${input.isPair}::boolean = true then record_type in (5, 10)
          when ${input.isPair}::boolean = false and ${input.isIncludeInstead}::boolean = true
            then (record_type in (0, 15) or ( record_type = 5 and user_id = ${scope.userUid} ))
          when ${input.isPair}::boolean = false and ${input.isIncludeInstead}::boolean = false then record_type = 0
          else true
        end)
        and to_char(cast(datetime as date), 'YYYY') = ${yearStr}
    )
    select
      year_month,
      sum(pay_price) as pay_sum,
      sum(income_price) as income_sum
    from converted_price
    group by year_month
    order by year_month
  `;
  return rows.map((row) => ({
    year_month: row.year_month,
    pay_sum: toNumber(row.pay_sum),
    income_sum: toNumber(row.income_sum)
  }));
}

// ============================================================
// func_get_type_summary_period（年次カテゴリ別）
// ============================================================

export type TypeSummaryPeriodRawRow = {
  year_month: string;
  type_id: number | null;
  type_name: string | null;
  type_color_classification_name: string | null;
  sum: number;
};

// 年次カテゴリ別集計（推移 > カテゴリ別「全て」）。旧 func_get_type_summary_period を移植。
export async function getTypeSummaryPeriodRows(
  scope: SessionScope,
  query: TypeSummaryPeriodQuery
): Promise<TypeSummaryPeriodRawRow[]> {
  const yearStr = String(query.year);
  const rows = await prisma.$queryRaw<
    Array<{
      year_month: string;
      type_id: bigint | number | null;
      type_name: string | null;
      type_color_classification_name: string | null;
      sum: bigint | number | null;
    }>
  >`
    with converted_records as (
      select
        to_char(cast(datetime as date),'YYYY-MM') as year_month,
        records.type_id,
        sum(records.price) as sum
      from ${schemaSql()}records
      left join ${schemaSql()}pairs on
        records.pair_id = pairs.id
      where
        ( records.user_id = ${scope.userUid}
          or pairs.user1_id = ${scope.userUid}
          or pairs.user2_id = ${scope.userUid}
        )
        and (case
          when ${query.isPair}::boolean = true then record_type in (5, 10)
          else (record_type in (0, 15) or ( record_type = 5 and (user_id = ${scope.userUid}) ))
        end)
        and (case
          when record_type = 15 and ${query.isPay}::boolean = true then (user_id = ${scope.userUid})
          when record_type = 15 and ${query.isPay}::boolean = false then (user_id <> ${scope.userUid})
          else is_pay = ${query.isPay}::boolean
        end)
        and to_char(cast(datetime as date),'YYYY') = ${yearStr}
      group by year_month, type_id
    )
    select
      year_month,
      converted_records.type_id,
      types.name as type_name,
      color_classifications.name as type_color_classification_name,
      converted_records.sum
    from converted_records
    left join ${schemaSql()}types on
      converted_records.type_id = types.id
    left join ${schemaSql()}color_classifications on
      types.color_classification_id = color_classifications.id
    order by converted_records.year_month, converted_records.type_id
  `;
  return rows.map((row) => ({
    year_month: row.year_month,
    type_id: toNullableNumber(row.type_id),
    type_name: row.type_name,
    type_color_classification_name: row.type_color_classification_name,
    sum: toNumber(row.sum)
  }));
}

// ============================================================
// func_get_sub_type_summary（年次サブカテゴリ別・カテゴリ選択時）
// ============================================================

export type SubTypeSummaryRawRow = {
  year_month: string;
  type_id: number;
  type_name: string;
  type_color_classification_name: string;
  sub_type_id: number | null;
  sub_type_name: string | null;
  sum: number;
};

// 年次サブカテゴリ別集計（推移 > カテゴリ別・特定カテゴリ選択時）。
// 旧 func_get_sub_type_summary を移植。
// ★注意（scope）: 旧 RPC は input_user_id を受け取らず scope 絞り込みを持たない
//   （type_id = input_type_id と year のみで絞る）。ただし input_type_id で絞る type は
//   その user/pair 所有の type であり、他人の records は他人の type_id を持つため、
//   type_id 一致だけで実質的に自分/ペアの records に限定される（旧仕様どおり）。
//   本移植は旧 SQL を改変しない方針のため、旧 RPC と同一の WHERE（scope 引数なし）を維持する。
export async function getSubTypeSummaryRows(input: {
  year: number;
  typeId: number;
}): Promise<SubTypeSummaryRawRow[]> {
  const yearStr = String(input.year);
  const rows = await prisma.$queryRaw<
    Array<{
      year_month: string;
      type_id: bigint | number;
      type_name: string;
      type_color_classification_name: string;
      sub_type_id: bigint | number | null;
      sub_type_name: string | null;
      sum: bigint | number | null;
    }>
  >`
    with converted_records as (
      select
        to_char(cast(datetime as date),'YYYY-MM') as year_month,
        type_id,
        sub_type_id,
        sum(price) as sum
      from ${schemaSql()}records
      where
        type_id = ${input.typeId}
        and to_char(cast(datetime as date),'YYYY') = ${yearStr}
      group by year_month, type_id, sub_type_id
    )
    select
      year_month,
      converted_records.type_id,
      types.name as type_name,
      color_classifications.name as type_color_classification_name,
      converted_records.sub_type_id,
      sub_types.name as sub_type_name,
      converted_records.sum
    from converted_records
    inner join ${schemaSql()}types on
      converted_records.type_id = types.id
    left join ${schemaSql()}sub_types on
      converted_records.sub_type_id = sub_types.id
    left join ${schemaSql()}color_classifications on
      types.color_classification_id = color_classifications.id
    order by converted_records.year_month, converted_records.type_id, converted_records.sub_type_id
  `;
  return rows.map((row) => ({
    year_month: row.year_month,
    type_id: toNumber(row.type_id),
    type_name: row.type_name,
    type_color_classification_name: row.type_color_classification_name,
    sub_type_id: toNullableNumber(row.sub_type_id),
    sub_type_name: row.sub_type_name,
    sum: toNumber(row.sum)
  }));
}
