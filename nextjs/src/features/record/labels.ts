// record feature 固有の UI 文言・定数。

export const recordLabels = {
  // 収支トグル。
  payToggle: {
    pay: '支出',
    income: '収入'
  },
  // 立替チェック。
  instead: '立替',
  // 登録/変更ボタン。
  action: {
    create: '登録',
    update: '変更'
  },
  // プレースホルダ。
  placeholder: {
    memo: 'メモ',
    selectMethod: '方法を選択'
  },
  // 見出し・空状態。
  heading: {
    note: '記録入力'
  },
  empty: {
    // カテゴリ/方法が未設定のとき note で案内する文言（旧 Nuxt 踏襲）。
    noTypeMethod: '設定画面でカテゴリと方法を追加してください'
  },
  // record 固有の失敗分類 → 文言。
  error: {
    pairRequired: 'ペア設定が必要です',
    sameMonthOnly: '定期的なものは同月中のみ変更可能です',
    noTarget: '対象がありません'
  }
} as const;

// 精算 record（record_type=15 / type 未設定）の表示名・表示色（旧 SettlementRecord 踏襲）。
// 'yellow' はグラフ・色マスタの双方で解決できる特別扱いの色名。
export const SETTLEMENT_DISPLAY = {
  name: '精算',
  color: 'yellow'
} as const;
