import 'server-only';
import { cache } from 'react';
import { prisma } from '@/lib/server/db/client';
import type { Id } from '@/lib/shared/types/id';

// マスタ（color_classification）リポジトリ。
// 色ピッカーやカードの色分けに使う。複数レーンが参照する被参照 I/F。
// マスタは全ユーザ共通の静的データのため scope 絞り込みは不要。

// color_classifications: 色マスタ（red / pink / ... / black）。
export type ColorClassification = {
  id: Id;
  name: string;
};

// 全ユーザ共通マスタ。id 昇順で安定させる（色選択 UI の並びを固定）。
// React cache() で per-request メモ化し、1 レンダリング内の重複 I/O を防ぐ
// （getSessionData / getReminderList と同方針。設定配下では
//  ページ直下と type/method カード取得の双方から呼ばれ 2〜3 回発火するため）。
export const getColorClassificationList = cache(
  async (): Promise<ColorClassification[]> => {
    return prisma.colorClassification.findMany({
      select: { id: true, name: true },
      orderBy: { id: 'asc' }
    });
  }
);
