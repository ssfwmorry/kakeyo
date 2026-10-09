// plan-reminder feature 固有の UI 文言。

export const planReminderLabels = {
  // 画面・見出し。
  heading: {
    plan: '予定',
    planType: '予定カテゴリ',
    reminder: '定期的な予定'
  },
  // ダイアログ見出しの対象名（dialogTitle が「〜を追加/編集」に組み立てる）。
  dialogEntity: {
    planType: '予定カテゴリ',
    reminder: '定期的な予定'
  },
  // 各エンティティ名（FormField の入力欄ラベル）。
  entity: {
    planName: '予定名',
    planTypeName: '予定カテゴリ名',
    reminderName: '定期的な予定名',
    memo: 'メモ',
    startDate: '開始日',
    endDate: '終了日',
    date: '直近の日付'
  },
  // plan 画面の操作・表示。
  plan: {
    period: '期間指定',
    selectDate: '日付を選択',
    noPlanType: '設定画面でカテゴリを追加してください',
    planTypeSelect: 'カテゴリを選択'
  },
  // plan/reminder 固有の失敗分類の文言。
  error: {
    pairRequired: 'ペア設定が必要です'
  },
  // フォームのバリデーション文言。
  validation: {
    planNameRequired: '予定名を入力してください',
    planNameMax: '予定名は 30 文字以内です',
    planTypeRequired: 'カテゴリを選択してください',
    planTypeNameRequired: 'カテゴリ名を入力してください',
    planTypeNameMax: 'カテゴリ名は 10 文字以内です',
    reminderNameRequired: '定期的な予定名を入力してください',
    reminderNameMax: '定期的な予定名は 10 文字以内です',
    colorRequired: '色を選択してください',
    dateRequired: '日付を選択してください',
    periodInvalid: '終了日は開始日以降にしてください',
    conditionInvalid: '繰り返しの条件を入力してください'
  }
} as const;
