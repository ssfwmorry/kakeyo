import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
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
//
// 2 層でキャッシュする。
// - React cache(): 1 レンダリング内の重複 I/O を防ぐ（設定配下ではページ直下と
//   type/method カード取得の双方から呼ばれ 2〜3 回発火するため）
// - use cache: Cookie を読まず全ユーザ共通・不変なのでサーバキャッシュに載せられる。
//   全ユーザで共有されるため最も効率がいい。マスタの更新は DB 直編集なので、
//   反映が要るときは cacheTag 経由で revalidateTag する。
export const getColorClassificationList = cache(
  async (): Promise<ColorClassification[]> => {
    'use cache';
    cacheLife('days');
    cacheTag('color-classification');

    return prisma.colorClassification.findMany({
      select: { id: true, name: true },
      orderBy: { id: 'asc' }
    });
  }
);
