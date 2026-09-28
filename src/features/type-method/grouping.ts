import type { ColorClassification } from '@/features/master';
import type { MethodRow } from './server/repositories/method';
import type { TypeRow } from './server/repositories/type';
import type {
  GroupedMethodList,
  GroupedTypeList,
  MethodCard,
  TypeCard
} from './types';

// 画面用グルーピングの純粋関数（server-only を含まない = Vitest 対象）。
// 色名解決 + is_pair 判定 + income/pay × self/pair の振り分けを行う。DB / React に触れない。

// 色 id → 色名の索引を作る。
function toColorNameMap(colors: ColorClassification[]): Map<number, string> {
  return new Map(colors.map((color) => [color.id, color.name]));
}

function toTypeCard(row: TypeRow, colorMap: Map<number, string>): TypeCard {
  return {
    id: row.id,
    name: row.name,
    colorClassificationId: row.colorClassificationId,
    colorName: colorMap.get(row.colorClassificationId) ?? '',
    isPair: row.pairId !== null,
    subTypes: row.subTypes.map((sub) => ({ id: sub.id, name: sub.name }))
  };
}

// type 行を income/pay × self/pair にグルーピングする。
// 行は sort 昇順で渡される前提（repositories が orderBy 済み）。
export function groupTypeList(
  rows: TypeRow[],
  colors: ColorClassification[]
): GroupedTypeList {
  const colorMap = toColorNameMap(colors);
  const grouped: GroupedTypeList = {
    income: { self: [], pair: [] },
    pay: { self: [], pair: [] }
  };
  for (const row of rows) {
    const card = toTypeCard(row, colorMap);
    const payGroup = row.isPay ? grouped.pay : grouped.income;
    const target = card.isPair ? payGroup.pair : payGroup.self;
    target.push(card);
  }
  return grouped;
}

function toMethodCard(
  row: MethodRow,
  colorMap: Map<number, string>
): MethodCard {
  return {
    id: row.id,
    name: row.name,
    colorClassificationId: row.colorClassificationId,
    colorName: colorMap.get(row.colorClassificationId) ?? '',
    isPair: row.pairId !== null
  };
}

// method の isPay を支払/受取/精算のグループキーに写す。
// null = 精算（both）。true = 支払（pay）。false = 受取（income）。
function toMethodGroupKey(isPay: boolean | null): 'pay' | 'income' | 'both' {
  if (isPay === null) {
    return 'both';
  }
  return isPay ? 'pay' : 'income';
}

// method 行を支払/受取/精算 × self/pair にグルーピングする。
// 精算（both）はペア共有専用で self は常に空にする。
// 個人所有（isPair=false）の精算 method は正常運用では作られないが、混入していても
// self 側へ漏らさない（GroupedMethodList の「both.self は常に空」契約を実装で保証）。
export function groupMethodList(
  rows: MethodRow[],
  colors: ColorClassification[]
): GroupedMethodList {
  const colorMap = toColorNameMap(colors);
  const grouped: GroupedMethodList = {
    income: { self: [], pair: [] },
    pay: { self: [], pair: [] },
    both: { self: [], pair: [] }
  };
  for (const row of rows) {
    const card = toMethodCard(row, colorMap);
    const groupKey = toMethodGroupKey(row.isPay);
    if (groupKey === 'both') {
      // 精算は pair 側にのみ寄せる（self は固定で空）。
      grouped.both.pair.push(card);
      continue;
    }
    const bucket = grouped[groupKey];
    const target = card.isPair ? bucket.pair : bucket.self;
    target.push(card);
  }
  return grouped;
}
