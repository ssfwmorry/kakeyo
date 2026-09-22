'use server';

import { requireAuth } from '@/features/auth/server/requireAuth';
import {
  colorHex,
  NO_SUB_TYPE_COLOR,
  SETTLEMENT_COLOR_NAME,
  SETTLEMENT_NAME,
  subTypeColor
} from './color';
import {
  buildMethodPie,
  buildPayIncomeBar,
  buildSubTypeStack,
  buildTypePeriodStack,
  buildTypePie,
  type PayIncomeShowData,
  type PieShowData,
  type StackShowData
} from './domain/chart-data';
import * as service from './server/services';

// L6 summary 画面のデータ取得 Server Actions（取得のみ・フォーム送信ではない）。
// Client のタブが年月/トグル/カテゴリ選択を変えるたびに useTransition から呼び、
// 整形済みのグラフデータ（PieShowData / PayIncomeShowData / StackShowData）を受け取る。
// session は各 Action で requireAuth() から取る（クライアント値を信用しない）。

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
    const items = await service.getTypeSummary(session, query);
    return buildTypePie(
      items,
      colorHex,
      SETTLEMENT_COLOR_NAME,
      SETTLEMENT_NAME
    );
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
// subTypeNameById はチップから来ないため、ここでは subTypeId の表示名を
// service（getSubTypeSummary）では返さない設計上、簡易ラベル（'サブ#id'）で補う。
// 旧 FE は sub_types 名を別途引いていたが、本移植は積み上げの見分けが目的のため
// サブカテゴリ名は凡例で id ベースの安定ラベルを使う（数字ズレには影響しない）。
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
    // 色は color.ts のパレットを単一の正として使う（値の二重定義を作らない）。
    subTypeColor,
    NO_SUB_TYPE_COLOR,
    'サブカテゴリなし'
  );
}
