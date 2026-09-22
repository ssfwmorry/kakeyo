// type-method feature 固有の UI 文言。

export const typeMethodLabels = {
  // カテゴリ設定タブ（支出/収入）。
  typeTab: {
    pay: '支出',
    income: '収入'
  },
  // 方法設定タブ（支払/受取/精算）。
  methodTab: {
    pay: '支払',
    income: '受取',
    both: '精算'
  },
  // 各エンティティ名（ダイアログ見出し / FormField ラベルで共有）。
  entity: {
    typeName: 'カテゴリ名',
    methodName: '方法名',
    subTypeName: 'サブカテゴリ名'
  },
  // 並べ替えボタンの aria-label。
  swap: {
    down: '下と入れ替え',
    next: '次と入れ替え'
  },
  // ペア設定が必要（type-method 固有の失敗分類）。
  error: {
    pairRequired: 'ペア設定が必要です'
  },
  // 設定 CRUD フォームのバリデーション文言。
  validation: {
    typeNameRequired: 'カテゴリ名を入力してください',
    subTypeNameRequired: 'サブカテゴリ名を入力してください',
    methodNameRequired: '方法名を入力してください',
    colorRequired: '色を選択してください'
  }
} as const;
