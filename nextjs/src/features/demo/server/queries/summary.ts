import 'server-only';
import {
  foldTypeSummary,
  type TypeSummaryFoldRow
} from '@/features/summary/domain/type-summary';
import type {
  MethodSummaryItem,
  PayAndIncomeItem,
  PieSummaryQuery,
  SubTypeSummaryRow,
  TypeSummaryItem,
  TypeSummaryPeriodQuery,
  TypeSummaryPeriodRow
} from '@/features/summary/types';
import type { SessionScope } from '@/lib/shared/types/auth';
import { RecordType } from '@/lib/shared/types/recordType';
import { findMethod } from '../dataset/methods';
import { findDemoUserName } from '../dataset/users';
import { type DemoRecordView, visibleRecordViews } from './record';

// summary のデモ射影。record の join 済みビューを、リポジトリの SQL と同じ record_type / is_pay
// の CASE 規則で集計する（solo / pair の出し分けは visibleRecordViews に委ねる）。

// record_type の絞り込み（SQL の CASE と同じ）。
// - ペアモード        : 共有(10) + 立替(5)（自分・相手とも）
// - 個人 + 立替込み   : 個人(0) + 精算(15) + 自分の立替(5)
// - 個人のみ          : 個人(0)
function matchesRecordType(
  view: DemoRecordView,
  isPair: boolean,
  isIncludeInstead: boolean
): boolean {
  if (isPair) {
    return (
      view.recordType === RecordType.instead ||
      view.recordType === RecordType.pair
    );
  }
  if (view.recordType === RecordType.self) {
    return true;
  }
  if (!isIncludeInstead) {
    return false;
  }
  return (
    view.recordType === RecordType.settlement ||
    (view.recordType === RecordType.instead && view.isSelf)
  );
}

// 支払 / 収入の絞り込み。精算(15)は is_pay を持たないため
// 「自分が払った精算 = 支払、相手が払った精算 = 収入」と読む（SQL と同じ）。
function matchesIsPay(view: DemoRecordView, isPay: boolean): boolean {
  if (view.recordType === RecordType.settlement) {
    return isPay ? view.isSelf : !view.isSelf;
  }
  return view.isPay === isPay;
}

function isYear(view: DemoRecordView, year: number): boolean {
  return view.yearMonth.startsWith(`${year}-`);
}

type SumGroup = { first: DemoRecordView; sum: number };

// キーごとに price を合算する（先頭行を代表として保持）。出現順を保つ。
function groupSum(
  views: DemoRecordView[],
  keyOf: (view: DemoRecordView) => string
): SumGroup[] {
  const groups = new Map<string, SumGroup>();
  for (const view of views) {
    const key = keyOf(view);
    const group = groups.get(key);
    if (group) {
      group.sum += view.price;
    } else {
      groups.set(key, { first: view, sum: view.price });
    }
  }
  return [...groups.values()];
}

function pieViews(
  scope: SessionScope,
  query: PieSummaryQuery
): DemoRecordView[] {
  return visibleRecordViews(scope).filter(
    (view) =>
      view.yearMonth === query.yearMonth &&
      matchesRecordType(view, query.isPair, query.isIncludeInstead) &&
      matchesIsPay(view, query.isPay)
  );
}

// 内訳（カテゴリ別）。type × sub_type で合算し、カテゴリ合計（partition sum）を各行に持たせて畳む。
// 精算（type 未設定）は typeId=null・名前 null の 1 グループ（SQL と同じ。isPair / 色は行の値のまま）。
export function getTypeSummary(
  scope: SessionScope,
  query: PieSummaryQuery
): TypeSummaryItem[] {
  const views = pieViews(scope, query);
  const sumByType = new Map(
    groupSum(views, (view) => String(view.typeId)).map((group) => [
      String(group.first.typeId),
      group.sum
    ])
  );
  const foldRows: TypeSummaryFoldRow[] = groupSum(
    views,
    (view) => `${view.typeId}:${view.subTypeId}`
  ).map(({ first, sum }) => ({
    typeId: first.typeId,
    typeName: first.typeId === null ? null : first.typeName,
    isPair: first.isPair,
    subTypeId: first.subTypeId,
    subTypeName: first.subTypeName,
    colorName: first.typeColorClassificationName,
    subTypeSum: sum,
    sum: sumByType.get(String(first.typeId)) ?? 0
  }));
  foldRows.sort((a, b) => b.sum - a.sum);
  return foldTypeSummary(foldRows);
}

// 方法の所有者（SQL の methods.pair_id / users.name 相当）。
// 個人の方法は所有者名を pair_user_name として返す（自分 = たろう / 相手 = はなこ）。
function methodOwner(methodId: number): {
  isPair: boolean;
  pairUserName: string | null;
} {
  const method = findMethod(methodId);
  if (method.pairId !== null) {
    return { isPair: true, pairUserName: null };
  }
  return { isPair: false, pairUserName: findDemoUserName(method.userUid) };
}

// 内訳（方法別）。合計降順。
export function getMethodSummary(
  scope: SessionScope,
  query: PieSummaryQuery
): MethodSummaryItem[] {
  return groupSum(pieViews(scope, query), (view) => String(view.methodId))
    .map(({ first, sum }) => ({
      methodId: first.methodId,
      methodName: first.methodName,
      colorName: first.methodColorClassificationName,
      ...methodOwner(first.methodId),
      sum
    }))
    .sort((a, b) => b.sum - a.sum);
}

// 推移 > 全体（年次 月別 支出/収入）。record が無い月は返さない（SQL と同じ）。
export function getPayAndIncomeList(
  scope: SessionScope,
  input: { year: number; isPair: boolean; isIncludeInstead: boolean }
): PayAndIncomeItem[] {
  const byMonth = new Map<string, PayAndIncomeItem>();
  const views = visibleRecordViews(scope).filter(
    (view) =>
      isYear(view, input.year) &&
      matchesRecordType(view, input.isPair, input.isIncludeInstead)
  );
  for (const view of views) {
    const item = byMonth.get(view.yearMonth) ?? {
      yearMonth: view.yearMonth,
      paySum: 0,
      incomeSum: 0
    };
    if (matchesIsPay(view, true)) {
      item.paySum += view.price;
    } else {
      item.incomeSum += view.price;
    }
    byMonth.set(view.yearMonth, item);
  }
  return [...byMonth.values()].sort((a, b) =>
    a.yearMonth.localeCompare(b.yearMonth)
  );
}

// 推移 > カテゴリ別（年次 月 × カテゴリ）。個人モードは立替込み固定（SQL と同じ）。
export function getTypeSummaryPeriod(
  scope: SessionScope,
  query: TypeSummaryPeriodQuery
): TypeSummaryPeriodRow[] {
  const views = visibleRecordViews(scope).filter(
    (view) =>
      isYear(view, query.year) &&
      matchesRecordType(view, query.isPair, true) &&
      matchesIsPay(view, query.isPay)
  );
  return groupSum(views, (view) => `${view.yearMonth}:${view.typeId}`)
    .map(({ first, sum }) => ({
      yearMonth: first.yearMonth,
      typeId: first.typeId,
      typeName: first.typeId === null ? null : first.typeName,
      typeColorClassificationName: first.typeColorClassificationName,
      sum
    }))
    .sort(
      (a, b) =>
        a.yearMonth.localeCompare(b.yearMonth) ||
        (a.typeId ?? Number.MAX_SAFE_INTEGER) -
          (b.typeId ?? Number.MAX_SAFE_INTEGER)
    );
}

// 推移 > カテゴリ別（特定カテゴリ選択時 = 年次 月 × サブカテゴリ）。scope 内の全 record が対象。
export function getSubTypeSummary(
  scope: SessionScope,
  input: { year: number; typeId: number }
): SubTypeSummaryRow[] {
  const views = visibleRecordViews(scope).filter(
    (view) => view.typeId === input.typeId && isYear(view, input.year)
  );
  return groupSum(views, (view) => `${view.yearMonth}:${view.subTypeId}`)
    .map(({ first, sum }) => ({
      yearMonth: first.yearMonth,
      subTypeId: first.subTypeId,
      sum
    }))
    .sort(
      (a, b) =>
        a.yearMonth.localeCompare(b.yearMonth) ||
        (a.subTypeId ?? -1) - (b.subTypeId ?? -1)
    );
}
