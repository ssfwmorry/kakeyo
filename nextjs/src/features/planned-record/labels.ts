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
  action: {
    create: '登録',
    update: '変更'
  },
  field: {
    day: '毎月何日か',
    method: '方法',
    memo: 'メモ',
    price: '金額'
  },
  placeholder: {
    memo: 'メモ',
    selectMethod: '方法を選択'
  },
  empty: {
    noTypeMethod: '設定画面でカテゴリと方法を追加してください'
  },
  swap: {
    down: '下と入れ替え'
  },
  error: {
    pairRequired: 'ペア設定が必要です',
    dayRequired: '毎月何日かを選択してください'
  }
} as const;
