// summary feature 固有の UI 文言。汎用文言（保存・削除・成否通知）は @/lib/shared/labels（L）を使う。

export const summaryLabels = {
  heading: {
    summary: '集計',
    monthPicker: '表示する月'
  },
  tab: {
    breakdown: '内訳',
    trend: '推移',
    settlement: '精算'
  },
  axis: {
    label: '集計の軸',
    type: 'カテゴリ',
    method: '方法'
  },
  instead: {
    label: '立替の扱い',
    include: '立替込み',
    onlyMe: '自分のみ'
  },
  // 軸で呼び名が変わる。カテゴリ軸は「支出／収入」、方法軸は「支払／受取」。
  kind: {
    pay: '支出',
    income: '収入',
    payByMethod: '支払',
    receiveByMethod: '受取'
  },
  // 推移タブ（原典 SumTrend）。
  trend: {
    kindLabel: '推移の種類',
    all: '全体',
    byType: 'カテゴリ別',
    // 全体のピル。収支は正負をまたぐ棒、支出のみは上向きだけ。
    balance: '収支',
    payOnly: '支出のみ',
    // カテゴリ別のピル。
    pay: '支出',
    income: '収入',
    // カテゴリのチップの先頭（カテゴリを絞らない）。
    allTypes: '全て',
    chipsLabel: '見るカテゴリ',
    yearTotal: '年間',
    table: {
      month: '月',
      pay: '支出',
      income: '収入',
      balance: '収支',
      total: '年計'
    }
  },
  empty: {
    noData: '表示するデータがありません'
  },
  note: {
    monthPicker:
      '選ぶとすぐにその月の内訳へ切り替わります。2023年より前は選べません。',
    records:
      'タップで記録を編集できます。相手が立て替えた記録は相手だけが編集できます。'
  }
} as const;

// 合計の見出し（ドーナツ中央）。「支出合計」「受取合計」など。
export function totalLabel(kind: string): string {
  return `${kind}合計`;
}

// 推移の見出し（「2026年の収支」「9月の支出」など）。
// 全体は収支か支出、カテゴリ別は選んだカテゴリの名前を対象にする。
export function trendHeadLabel(period: string, target: string): string {
  return `${period}の${target}`;
}

// 内訳の脚注。立替をどう含めたかを説明する（原典 SumBreakdown の footnote）。
// ペア未設定のときは立替そのものが無いので、切替の説明は出さない（D6）。
export function breakdownFootnote(
  hasPair: boolean,
  isPair: boolean,
  isIncludeInstead: boolean,
  kind: string
): string | null {
  if (!hasPair) {
    return null;
  }
  if (isPair) {
    return '共有モードは二人の家計を見るため、立替かどうかは区別せず、精算は含めません。';
  }
  if (isIncludeInstead) {
    return `立替込み：相手の分の立替と精算を含めた、相手を考慮した自分の${kind}です。`;
  }
  return `自分のみ：立替と精算を含めない、自分個人の${kind}です。`;
}
