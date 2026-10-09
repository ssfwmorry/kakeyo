// summary feature 固有の UI 文言。汎用文言（保存・削除・成否通知）は @/lib/shared/labels（L）を使う。

export const summaryLabels = {
  heading: {
    summary: '集計'
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
  // 精算タブ（原典 SumSettle）。
  settlement: {
    stepsLabel: '精算の手順',
    steps: ['準備', '分類', '精算'],
    ready: {
      lead: '立替の記録それぞれに精算率（自分：相手）を割り当てて、この月の精算額を出します。',
      start: '分類を始める'
    },
    classify: {
      hint: '立替を選んで、まとめて精算率を割り当てられます。',
      sum: '合計',
      asIs: '自分の支払',
      toBe: '自分の負担',
      result: '精算額',
      cancel: 'キャンセル',
      confirm: '分類を確定',
      confirmDisabled: '精算率を選ぶと確定できます',
      note: '精算率を選ばなかった立替は、未精算のまま翌月以降に残ります。',
      // 率ごとのグループ（既定は畳む）。
      groupsHeading: '分類ずみ',
      groupsLabel: '率ごとの分類'
    },
    // 立替の一覧と、まとめて率を割り当てる操作。
    list: {
      heading: '立替',
      unassigned: '未分類',
      empty: '立替はありません',
      rateUnset: '未設定',
      selectAll: 'すべて選ぶ',
      clearSelection: '選択を解除',
      bulkAssign: 'まとめて精算率を選ぶ',
      toggleLabel: 'この立替を選ぶ'
    },
    finish: {
      result: '分類結果',
      method: '精算方法',
      price: '精算金額',
      cancel: 'キャンセル',
      complete: '精算を完了する',
      needMethod: '精算方法を追加すると完了できます',
      needPrice: '精算金額を入れると完了できます',
      noMethod: '設定の「方法」で精算方法を追加してください'
    },
    done: {
      sub: '未精算の立替はありません'
    },
    none: {
      sub: '精算するものはありません'
    },
    couple: {
      heading: '二人のお金',
      note: '精算の対象外',
      empty: '共有の記録はありません'
    },
    settled: '精算済み',
    // 名前が引けないときの呼び名。立替者は原則ユーザ名で出す。
    selfFallback: '自分',
    partnerFallback: '相手',
    rateSheet: {
      heading: '精算率を選ぶ',
      hintLeft: '自分が多く負担',
      hintCenter: '自分：相手',
      hintRight: '相手が多く負担',
      pick: '精算率を選ぶ'
    },
    // 複数件にまとめて割り当てるときの見出し（「3件 · 合計 7,500円」）。
    rateSheetMany: '合計'
  },
  empty: {
    noData: '表示するデータがありません'
  },
  note: {
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

// 精算のバッジ（「ゆかとの精算」）。
export function settlementBadge(partnerName: string): string {
  return `${partnerName}との精算`;
}

// 精算の済んだ月の見出し。立替が 1 件もない月は「済んでいる」とは言わない。
export function settlementDoneTitle(
  month: number,
  hasInstead: boolean
): string {
  return hasInstead
    ? `${month}月の精算は済んでいます`
    : `${month}月の立替はありません`;
}

// 率のグループの差額（「渡す 1,200」「受け取る 800」「差額なし」）。
export function settlementDiffText(diff: number): string {
  if (diff === 0) {
    return '差額なし';
  }
  const amount = Math.abs(diff).toLocaleString('ja-JP');
  return diff > 0 ? `渡す ${amount}` : `受け取る ${amount}`;
}

// 精算額の右に添える動詞（「円を渡す」「円を受け取る」「（差額なし）」）。
export function settlementResultVerb(diff: number): string {
  if (diff === 0) {
    return '（差額なし）';
  }
  return diff > 0 ? '円を渡す' : '円を受け取る';
}

// 分類結果の名詞（「1,200円のお渡し」「800円の受け取り」）。
export function settlementResultNoun(diff: number): string {
  if (diff === 0) {
    return '差額なし';
  }
  return diff > 0 ? 'お渡し' : '受け取り';
}

// 完了ボタンの下の説明。精算 record の日付を添える。
export function settlementFinishNote(monthEndLabel: string): string {
  return `${monthEndLabel}付けで「精算」の記録を作り、分類した立替をすべて精算済みにします。精算額が0円のときは記録を作らず、精算済みにするだけです。`;
}

// 畳んだ率グループの見出し（「分類ずみ 3件」）。
export function settlementAssignedText(count: number): string {
  return `${summaryLabels.settlement.classify.groupsHeading} ${count}件`;
}

// 複数件へまとめて割り当てるときのシートの見出し（「3件 · 合計 7,500円」）。
export function settlementManyTitle(count: number, sum: number): string {
  const total = sum.toLocaleString('ja-JP');
  return `${count}件 · ${summaryLabels.settlement.rateSheetMany} ${total}円`;
}

// 立替者の見出し（「たろうの立替」）。
export function insteadByName(userName: string): string {
  return `${userName}の立替`;
}

// 精算 record の「だれからだれへ」（「たろう → はなこ」）。
export function settlementTransferText(
  isPayerSelf: boolean,
  names: { self: string; partner: string }
): string {
  return isPayerSelf
    ? `${names.self} → ${names.partner}`
    : `${names.partner} → ${names.self}`;
}
