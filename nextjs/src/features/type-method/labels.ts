// type-method feature 固有の UI 文言。

export const typeMethodLabels = {
  // 設定画面のセクション見出し。
  heading: {
    type: 'カテゴリ',
    method: '方法'
  },
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
  // 各エンティティ名（FormField の入力欄ラベル）。
  entity: {
    typeName: 'カテゴリ名',
    methodName: '方法名',
    subTypeName: 'サブカテゴリ名'
  },
  // ダイアログ見出しの対象名（dialogTitle が「〜を追加/編集」に組み立てる）。
  // 方法は支払/受取/精算でタブが分かれるため、どれを追加するのかまで名乗る。
  dialogEntity: {
    type: 'カテゴリ',
    subType: 'サブカテゴリ',
    method: {
      pay: '支払方法',
      income: '受取方法',
      both: '精算方法'
    }
  },
  // 並べ替えボタンの aria-label。
  swap: {
    down: '下と入れ替え'
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
