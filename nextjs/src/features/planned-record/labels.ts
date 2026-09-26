// planned-record（定期）feature 固有の UI 文言。

export const plannedRecordLabels = {
  heading: {
    plannedRecord: '定期的な収入・支出'
  },
  // record feature と同語彙だが、所有境界のため自前で持つ。
  payToggle: {
    pay: '支出',
    income: '収入'
  },
  instead: '立替',
  field: {
    day: '毎月何日か',
    method: '方法',
    memo: 'メモ',
    price: '金額'
  },
  placeholder: {
    memo: 'メモ'
  },
  empty: {
    noTypeMethod: '設定画面でカテゴリと方法を追加してください',
    // 収支・立替の組み合わせに使える方法が 1 件もないとき。
    noMethod: '設定画面で方法を追加してください'
  },
  action: {
    add: '定期を追加'
  },
  confirm: {
    delete: 'この定期を削除します。元に戻せません。'
  },
  error: {
    pairRequired: 'ペア設定が必要です',
    dayRequired: '毎月何日かを選択してください'
  }
} as const;
