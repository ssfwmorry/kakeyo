// planned-record（定期）feature 固有の UI 文言。

export const plannedRecordLabels = {
  // 見出し（設定「定期」タブ。旧 KakeiPlannedRecord.vue 踏襲）。
  heading: {
    plannedRecord: '定期的な収入・支出'
  },
  // 収支トグル（旧 note.vue 踏襲。record feature と同語彙だが所有境界のため自前で持つ）。
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
  // フォームのラベル・プレースホルダ。
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
    // カテゴリ/方法が未設定のとき note で案内する文言（旧 Nuxt 踏襲）。
    noTypeMethod: '設定画面でカテゴリと方法を追加してください'
  },
  // 並べ替えボタンの aria-label。
  swap: {
    down: '下と入れ替え'
  },
  // planned_record 固有の失敗分類 → 文言。
  error: {
    pairRequired: 'ペア設定が必要です',
    dayRequired: '毎月何日かを選択してください'
  }
} as const;
