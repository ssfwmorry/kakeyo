'use server';

import { requireAuth } from '@/features/auth/server/requireAuth';
import {
  colorHex,
  NO_SUB_TYPE_COLOR,
  SETTLEMENT_NAME,
  subTypeColor
} from './color';
import {
  buildMethodPie,
  buildPayIncomeBar,
  buildSubTypeStack,
  buildTypePeriodStack,
  type PayIncomeShowData,
  type PieShowData,
  type StackShowData
} from './domain/chart-data';
import * as service from './server/services';

// summary 画面のデータ取得 Server Actions（取得のみ・フォーム送信ではない）。
// Client のタブが年月/トグル/カテゴリ選択を変えるたびに呼ばれ、整形済みのグラフデータを返す。

// 内訳（カテゴリ別 or 方法別）の円 + 一覧を返す。
export async function fetchPieAction(input: {
  isType: boolean;
  isPay: boolean;
  isPair: boolean;
  isIncludeInstead: boolean;
  yearMonth: string;
}): Promise<PieShowData> {
  const session = await requireAuth();
  // ペアが無いユーザは isPair を強制 false（scope が個人に閉じる）。
  const isPair = session.pairId !== null && input.isPair;
  const query = {
    isPay: input.isPay,
    isPair,
    isIncludeInstead: isPair ? false : input.isIncludeInstead,
    yearMonth: input.yearMonth
  };

  if (input.isType) {
    return service.getTypePie(session, query);
  }
  const items = await service.getMethodSummary(session, query);
  return buildMethodPie(items, colorHex);
}

// 推移 > 全体（年次 月別 支出/収支）を返す。
export async function fetchPayIncomeAction(input: {
  year: number;
  isPair: boolean;
  isIncludeInstead: boolean;
}): Promise<PayIncomeShowData> {
  const session = await requireAuth();
  const isPair = session.pairId !== null && input.isPair;
  const items = await service.getPayAndIncomeList(session, {
    year: input.year,
    isPair,
    isIncludeInstead: isPair ? false : input.isIncludeInstead
  });
  return buildPayIncomeBar(items, input.year);
}

// 推移 > カテゴリ別（「全て」= 年次カテゴリ別 積み上げ棒）を返す。
export async function fetchTypePeriodAction(input: {
  year: number;
  isPay: boolean;
  isPair: boolean;
}): Promise<StackShowData> {
  const session = await requireAuth();
  const isPair = session.pairId !== null && input.isPair;
  const rows = await service.getTypeSummaryPeriod(session, {
    year: input.year,
    isPay: input.isPay,
    isPair
  });
  return buildTypePeriodStack(rows, input.year, colorHex, SETTLEMENT_NAME);
}

// 推移 > カテゴリ別（特定カテゴリ選択時 = 年次サブカテゴリ別 積み上げ棒）を返す。
// service（getSubTypeSummary）はサブカテゴリ名を返さないため、凡例は id ベースの
// 安定ラベル（'サブ#id'）で補う（積み上げの見分けが目的で、集計値には影響しない）。
export async function fetchSubTypeAction(input: {
  year: number;
  typeId: number;
}): Promise<StackShowData> {
  const session = await requireAuth();
  const rows = await service.getSubTypeSummary(session, {
    year: input.year,
    typeId: input.typeId
  });
  return buildSubTypeStack(
    rows,
    input.year,
    (subTypeId) =>
      subTypeId === null ? 'サブカテゴリなし' : `サブ${subTypeId}`,
    subTypeColor,
    NO_SUB_TYPE_COLOR,
    'サブカテゴリなし'
  );
}
