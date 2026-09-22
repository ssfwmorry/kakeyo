// bank feature 固有の UI 文言（feature 内コロケーション）。
// 全 feature 共通の汎用文言は @/lib/shared/labels（L）に置く。ここは bank 固有のみ。
// 汎用ボタン（保存・削除・色・編集）や成否通知・汎用エラーは L を使い、ここには入れない。

export const bankLabels = {
  heading: {
    bank: '口座',
    balanceRegister: '残高登録',
    bankName: '口座名',
    balance: '残高'
  },
  field: {
    recordDate: '記録日',
    total: '合計'
  },
  placeholder: {
    selectBank: '口座を選択',
    balanceYen: '残高（円）'
  },
  action: {
    addBalance: '残高追加',
    addRow: '＋行追加',
    register: '登録',
    removeRow: 'この行を削除'
  },
  empty: {
    balanceHistory: '残高履歴を追加してください'
  },
  error: {
    // 横断 L.error.notFound は「対象が見つかりません」で文言が異なるため、
    // 表示文字列を変えない目的で bank 固有として保持する。
    bankNotFound: '対象の口座が見つかりません'
  },
  validation: {
    bankRequired: '口座を選択してください',
    nameRequired: '口座名を入力してください',
    nameMaxLength: '口座名は30文字以内で入力してください',
    colorRequired: '色を選択してください',
    priceMin: '残高は1円以上で入力してください',
    rowsMin: '残高を1件以上入力してください',
    duplicateBank: '同じ口座は登録できません'
  }
} as const;
