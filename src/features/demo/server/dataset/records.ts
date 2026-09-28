import 'server-only';
import { resolveRecordOwnership } from '@/features/record/domain/record-fields';
import { RecordType } from '@/lib/shared/types/recordType';
import { type DemoMethod, methods } from './methods';
import { plannedRecords } from './planned-records';
import { type DemoSubType, type DemoType, subTypes, types } from './types';
import { type DemoUser, demoPair, demoUsers, type Owned } from './users';

// records（デモの家計データの単一の正）。
// 2026-01〜09 の record を「月別の変動分テーブル + 固定分」から生成する。summary のデモは
// この record 群を集計して作るため、集計値を手書きせずとも明細と集計値が構造上一致する。
//
// 行は実 DB の records に近い正規化した形（typeId / methodId などの参照のみ。名前・色は持たない）。
// 所有者列（user_id / pair_id / is_settled / record_type）は実処理と同じ
// resolveRecordOwnership で導出し、0/5/10/15 を手書きしない。
//
// solo デモには個人 record（pair_id なし）だけが見える。pair デモは個人 record + ペア共有
// record（共有 10 / 立替 5 / 精算 15）。実 DB の scope と同じく、相手の純個人 record は含まない。

export type DemoRecord = Owned & {
  id: number;
  datetime: Date;
  // 生成時の暦日（JST）から取る。datetime から毎回求め直さない。
  yearMonth: string;
  isPay: boolean | null;
  price: number;
  memo: string | null;
  recordType: RecordType;
  typeId: number | null;
  subTypeId: number | null;
  methodId: number;
  plannedRecordId: number | null;
  isSettled: boolean | null;
};

// デモの「今月」。この月の立替は未精算（精算タブに精算対象として出す）。
export const CURRENT_YEAR_MONTH = '2026-09';

// JST 正午の Date（JST 暦日がずれない時刻で固定）。
function jstNoon(date: string): Date {
  return new Date(`${date}T03:00:00.000Z`);
}

// 月別の変動分。solo は食費の内訳と日用品（交通費 / 住居 / 給料は固定）、
// pair は食費の内訳・日用品・光熱費・立替（家賃 / 手当は固定）。
type DemoMonth = {
  yearMonth: string;
  solo: { eatOut: number; grocery: number; daily: number };
  pair: {
    eatOut: number;
    grocery: number;
    daily: number;
    utility: number;
    insteadSelf: number;
    insteadPartner: number;
  };
};

const monthly: DemoMonth[] = [
  {
    yearMonth: '2026-01',
    solo: { eatOut: 6400, grocery: 11000, daily: 3000 },
    pair: {
      eatOut: 8000,
      grocery: 32000,
      daily: 4500,
      utility: 18000,
      insteadSelf: 3200,
      insteadPartner: 5400
    }
  },
  {
    yearMonth: '2026-02',
    solo: { eatOut: 1800, grocery: 3300, daily: 1600 },
    pair: {
      eatOut: 6500,
      grocery: 29000,
      daily: 3800,
      utility: 17500,
      insteadSelf: 2800,
      insteadPartner: 4100
    }
  },
  {
    yearMonth: '2026-03',
    solo: { eatOut: 9800, grocery: 15000, daily: 4500 },
    pair: {
      eatOut: 12000,
      grocery: 34000,
      daily: 5200,
      utility: 15000,
      insteadSelf: 4600,
      insteadPartner: 3300
    }
  },
  {
    yearMonth: '2026-04',
    solo: { eatOut: 4100, grocery: 8000, daily: 1800 },
    pair: {
      eatOut: 9000,
      grocery: 31000,
      daily: 4100,
      utility: 12500,
      insteadSelf: 2400,
      insteadPartner: 6100
    }
  },
  {
    yearMonth: '2026-05',
    solo: { eatOut: 8900, grocery: 13000, daily: 3300 },
    pair: {
      eatOut: 14000,
      grocery: 33000,
      daily: 6300,
      utility: 11000,
      insteadSelf: 5100,
      insteadPartner: 2900
    }
  },
  {
    yearMonth: '2026-06',
    solo: { eatOut: 2300, grocery: 4000, daily: 1500 },
    pair: {
      eatOut: 7500,
      grocery: 30000,
      daily: 3600,
      utility: 12000,
      insteadSelf: 3700,
      insteadPartner: 4400
    }
  },
  {
    yearMonth: '2026-07',
    solo: { eatOut: 12200, grocery: 18000, daily: 4300 },
    pair: {
      eatOut: 16000,
      grocery: 36000,
      daily: 5800,
      utility: 16500,
      insteadSelf: 2200,
      insteadPartner: 7300
    }
  },
  {
    yearMonth: '2026-08',
    solo: { eatOut: 5900, grocery: 10000, daily: 2400 },
    pair: {
      eatOut: 11000,
      grocery: 35000,
      daily: 4700,
      utility: 19000,
      insteadSelf: 4900,
      insteadPartner: 3800
    }
  },
  {
    yearMonth: '2026-09',
    solo: { eatOut: 5280, grocery: 10000, daily: 1500 },
    pair: {
      eatOut: 9800,
      grocery: 33000,
      daily: 5100,
      utility: 15500,
      insteadSelf: 3000,
      insteadPartner: 4500
    }
  }
];

// 固定分。定期由来（家賃 / 給料 / ペアの家賃 / 手当）は planned_records の金額と一致させる。
const FIXED = {
  transport: 12000,
  housing: plannedRecords.housing.price,
  salary: plannedRecords.salary.price,
  rent: plannedRecords.pairRent.price,
  allowance: plannedRecords.pairAllowance.price
} as const;

// record 1 件の生成仕様（DTO ではなく「誰が・どう起票したか」で書く）。
// payer = 起票者。共有（PAIR）は resolveRecordOwnership が user_id を落とすため誰でもよい。
type Spec = {
  date: string;
  payer: DemoUser;
  isPair: boolean;
  isInstead: boolean;
  isPay: boolean;
  price: number;
  memo: string | null;
  type: DemoType;
  subType: DemoSubType | null;
  method: DemoMethod;
  plannedRecordId: number | null;
};

type SpecExtra = Partial<Pick<Spec, 'isPay' | 'subType' | 'plannedRecordId'>>;

// 月・起票者・record 種別を固定し、日・金額・メモ・マスタだけを受ける生成ヘルパ。
function specBuilder(
  yearMonth: string,
  base: Pick<Spec, 'payer' | 'isPair' | 'isInstead'>
) {
  return (
    day: string,
    price: number,
    memo: string,
    type: DemoType,
    method: DemoMethod,
    extra: SpecExtra = {}
  ): Spec => ({
    date: `${yearMonth}-${day}`,
    isPay: true,
    price,
    memo,
    type,
    subType: null,
    method,
    plannedRecordId: null,
    ...base,
    ...extra
  });
}

// 個人 record（月 10 件）。食費・日用品は月別合計を固定比率で複数件に割り、端数は最後の 1 件へ寄せる
// （合計がテーブルの値と一致する）。
function soloSpecs(yearMonth: string, month: DemoMonth['solo']): Spec[] {
  const lunch = Math.round((month.eatOut * 5) / 22);
  const coffee = Math.round(month.eatOut / 11);
  const dinner = month.eatOut - lunch - coffee;
  const groceryA = Math.round(month.grocery * 0.48);
  const groceryB = month.grocery - groceryA;
  const dailyA = Math.round(month.daily * 0.6533);
  const dailyB = month.daily - dailyA;
  const self = specBuilder(yearMonth, {
    payer: demoUsers.self,
    isPair: false,
    isInstead: false
  });

  return [
    self('01', lunch, 'ランチ', types.food, methods.cash, {
      subType: subTypes.eatOut
    }),
    self('01', FIXED.housing, '家賃', types.housing, methods.debit, {
      plannedRecordId: plannedRecords.housing.id
    }),
    self('03', groceryA, 'スーパー', types.food, methods.credit, {
      subType: subTypes.grocery
    }),
    self('05', dailyA, '洗剤', types.daily, methods.cash),
    self('08', FIXED.transport, '定期券', types.transport, methods.credit),
    self('12', dinner, '外食', types.food, methods.credit, {
      subType: subTypes.eatOut
    }),
    self('15', groceryB, 'スーパー', types.food, methods.credit, {
      subType: subTypes.grocery
    }),
    self('20', dailyB, 'ティッシュ', types.daily, methods.cash),
    self('22', coffee, 'コーヒー', types.food, methods.cash, {
      subType: subTypes.eatOut
    }),
    self('25', FIXED.salary, '給料', types.salary, methods.transfer, {
      isPay: false,
      plannedRecordId: plannedRecords.salary.id
    })
  ];
}

// ペア共有 record（月 8 件）。立替は自分の方法 / 相手の方法でペアのカテゴリを支払う。
function pairSpecs(yearMonth: string, month: DemoMonth['pair']): Spec[] {
  const shared = specBuilder(yearMonth, {
    payer: demoUsers.self,
    isPair: true,
    isInstead: false
  });
  const insteadBySelf = specBuilder(yearMonth, {
    payer: demoUsers.self,
    isPair: true,
    isInstead: true
  });
  const insteadByPartner = specBuilder(yearMonth, {
    payer: demoUsers.partner,
    isPair: true,
    isInstead: true
  });

  return [
    insteadBySelf(
      '02',
      month.insteadSelf,
      '洗剤（立替）',
      types.pairDaily,
      methods.credit
    ),
    insteadByPartner(
      '04',
      month.insteadPartner,
      'まとめ買い（立替）',
      types.pairFood,
      methods.partnerCredit,
      { subType: subTypes.pairGrocery }
    ),
    shared('06', month.eatOut, '外食', types.pairFood, methods.familyCard, {
      subType: subTypes.pairEatOut
    }),
    shared(
      '10',
      FIXED.allowance,
      '手当',
      types.pairAllowance,
      methods.jointDeposit,
      { isPay: false, plannedRecordId: plannedRecords.pairAllowance.id }
    ),
    shared(
      '13',
      month.grocery,
      'スーパー',
      types.pairFood,
      methods.familyCard,
      { subType: subTypes.pairGrocery }
    ),
    shared('18', month.daily, '日用品', types.pairDaily, methods.wallet),
    shared(
      '20',
      month.utility,
      '電気・ガス',
      types.pairUtility,
      methods.jointDebit
    ),
    shared('25', FIXED.rent, '家賃', types.pairHousing, methods.jointDebit, {
      plannedRecordId: plannedRecords.pairRent.id
    })
  ];
}

// 仕様 → 行。所有者列は実処理（記録登録）と同じ規則で導出する。
function toRecord(id: number, spec: Spec, isCurrent: boolean): DemoRecord {
  const ownership = resolveRecordOwnership({
    userUid: spec.payer.uid,
    pairId: demoPair.id,
    isPair: spec.isPair,
    isInstead: spec.isInstead
  });
  return {
    id,
    userUid: ownership.userId,
    pairId: ownership.pairId,
    datetime: jstNoon(spec.date),
    yearMonth: spec.date.slice(0, 7),
    isPay: spec.isPay,
    price: spec.price,
    memo: spec.memo,
    recordType: ownership.recordType,
    typeId: spec.type.id,
    subTypeId: spec.subType?.id ?? null,
    methodId: spec.method.id,
    plannedRecordId: spec.plannedRecordId,
    // 立替（is_settled=false で起票）は過去月なら精算済みにする。それ以外は精算概念なし。
    isSettled: ownership.isSettled === null ? null : !isCurrent
  };
}

// 精算 record（insertSettlementRecord と同じ列）。立替差額の半分を、多く立て替えられた側
// （負担が少ない側）が相手へ送金する。
function settlementRecord(
  id: number,
  yearMonth: string,
  month: DemoMonth['pair']
): DemoRecord {
  const diff = month.insteadPartner - month.insteadSelf;
  const payer = diff > 0 ? demoUsers.self : demoUsers.partner;
  return {
    id,
    userUid: payer.uid,
    pairId: demoPair.id,
    datetime: jstNoon(`${yearMonth}-28`),
    yearMonth,
    isPay: null,
    price: Math.round(Math.abs(diff) / 2),
    memo: null,
    recordType: RecordType.settlement,
    typeId: null,
    subTypeId: null,
    methodId: methods.settlement.id,
    plannedRecordId: null,
    isSettled: null
  };
}

// 全 record を月順に生成し id を連番で振る。
function generateRecords(): DemoRecord[] {
  const rows: DemoRecord[] = [];
  for (const month of monthly) {
    const isCurrent = month.yearMonth === CURRENT_YEAR_MONTH;
    const specs = [
      ...soloSpecs(month.yearMonth, month.solo),
      ...pairSpecs(month.yearMonth, month.pair)
    ];
    for (const spec of specs) {
      rows.push(toRecord(rows.length + 1, spec, isCurrent));
    }
    if (!isCurrent) {
      rows.push(settlementRecord(rows.length + 1, month.yearMonth, month.pair));
    }
  }
  return rows;
}

export const recordRows: DemoRecord[] = generateRecords();
