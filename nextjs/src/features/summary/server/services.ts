import 'server-only';
import { withDemoRead } from '@/features/auth/server/demo';
import {
  getMethodCardList,
  getTypeCardList
} from '@/features/type-method/server/services';
import type { SessionData } from '@/lib/shared/types/auth';
import { foldTypeSummary } from '../domain/type-summary';
import type {
  MethodSummaryItem,
  PayAndIncomeItem,
  PieSummaryQuery,
  SubTypeSummaryRow,
  TypeChipsByQuadrant,
  TypeSummaryItem,
  TypeSummaryPeriodQuery,
  TypeSummaryPeriodRow
} from '../types';
import {
  demoMethodSummary,
  demoPayAndIncome,
  demoSubTypeSummary,
  demoTypeChips,
  demoTypeSummary,
  demoTypeSummaryPeriod
} from './demo';
import * as summaryRepo from './repositories/summary';

// L6 summary サービス層（server-only）。Server Component / Server Action から呼ぶ入口。
// 取得のみのため戻りは Result ではなく直返し（bank の READ サービスに合わせる）。
// 取得は withDemoRead でデモ注入（デモ時は DB へ触れずモックを返す）。
// scope（userUid/pairId）は session から確定し、クライアント値を信用しない。

// 内訳（カテゴリ別）。横長行を TypeSummaryItem[] へ畳み込む。
export async function getTypeSummary(
  session: SessionData,
  query: PieSummaryQuery
): Promise<TypeSummaryItem[]> {
  return withDemoRead(session.isDemo, demoTypeSummary, async () => {
    const rows = await summaryRepo.getTypeSummaryRows(session, query);
    return foldTypeSummary(
      rows.map((row) => ({
        typeId: row.type_id,
        typeName: row.type_name,
        isPair: row.is_pair,
        subTypeId: row.sub_type_id,
        subTypeName: row.sub_type_name,
        colorName: row.color_name,
        subTypeSum: row.sub_type_sum,
        sum: row.sum
      }))
    );
  });
}

// 内訳（方法別）。
export async function getMethodSummary(
  session: SessionData,
  query: PieSummaryQuery
): Promise<MethodSummaryItem[]> {
  return withDemoRead(session.isDemo, demoMethodSummary, async () => {
    const rows = await summaryRepo.getMethodSummaryRows(session, query);
    return rows.map((row) => ({
      methodId: row.method_id,
      methodName: row.method_name,
      pairUserName: row.pair_user_name,
      colorName: row.color_name,
      isPair: row.is_pair,
      sum: row.sum
    }));
  });
}

// 推移 > 全体（年次 月別 支出/収入）。
export async function getPayAndIncomeList(
  session: SessionData,
  input: { year: number; isPair: boolean; isIncludeInstead: boolean }
): Promise<PayAndIncomeItem[]> {
  return withDemoRead(session.isDemo, demoPayAndIncome, async () => {
    const rows = await summaryRepo.getPayAndIncomeRows(session, input);
    return rows.map((row) => ({
      yearMonth: row.year_month,
      paySum: row.pay_sum,
      incomeSum: row.income_sum
    }));
  });
}

// 推移 > カテゴリ別（「全て」= 年次カテゴリ別）。
export async function getTypeSummaryPeriod(
  session: SessionData,
  query: TypeSummaryPeriodQuery
): Promise<TypeSummaryPeriodRow[]> {
  return withDemoRead(session.isDemo, demoTypeSummaryPeriod, async () => {
    const rows = await summaryRepo.getTypeSummaryPeriodRows(session, query);
    return rows.map((row) => ({
      yearMonth: row.year_month,
      typeId: row.type_id,
      typeName: row.type_name,
      typeColorClassificationName: row.type_color_classification_name,
      sum: row.sum
    }));
  });
}

// 推移 > カテゴリ別（特定カテゴリ選択時 = 年次サブカテゴリ別）。
// typeId は公開 Server Action にクライアントが渡す値のため、リポジトリで records を
// scope（自分/ペア）に絞り込む（他ペアの typeId を渡しても空になる。IDOR 防止）。
export async function getSubTypeSummary(
  session: SessionData,
  input: { year: number; typeId: number }
): Promise<SubTypeSummaryRow[]> {
  return withDemoRead(session.isDemo, demoSubTypeSummary, async () => {
    const rows = await summaryRepo.getSubTypeSummaryRows(session, input);
    return rows.map((row) => ({
      yearMonth: row.year_month,
      subTypeId: row.sub_type_id,
      sum: row.sum
    }));
  });
}

// 推移 > カテゴリ別のチップ（カテゴリ選択肢）。type-method の GroupedTypeList を
// isPay × isPair の 4 象限に平坦化して返す（scope 内のカテゴリのみ = getSubTypeSummary の
// typeId 供給元）。方法別チップは使わないためカテゴリのみ。
export async function getTypeChips(
  session: SessionData
): Promise<TypeChipsByQuadrant> {
  return withDemoRead(session.isDemo, demoTypeChips, async () => {
    // カテゴリ一覧のみ type-method から取得する（精算方法はここでは扱わない）。
    const grouped = await getTypeCardList(session);
    const toChips = (
      cards: { id: number; name: string; colorName: string }[]
    ) =>
      cards.map((card) => ({
        typeId: card.id,
        name: card.name,
        colorName: card.colorName
      }));
    return {
      pay: {
        self: toChips(grouped.pay.self),
        pair: toChips(grouped.pay.pair)
      },
      income: {
        self: toChips(grouped.income.self),
        pair: toChips(grouped.income.pair)
      }
    };
  });
}

// getMethodCardList は精算方法選択で使うため re-export しない（画面/アクションが
// server/services から直接 import する方針。ここでは summary 固有取得のみ公開）。
export { getMethodCardList };
