// 成否通知トーストの共通文言（全 feature 横断・凍結資産）。
// CRUD の成功文言はドメインを問わず同じ（skill-kick の SNACKBAR に相当）。
// 各 feature の Server Action は toFormResult の success/fallbackError にこれを渡す。

export const snackbarLabels = {
  created: '登録しました',
  updated: '変更しました',
  deleted: '削除しました',
  swapped: '入れ替えました',
  failed: '処理に失敗しました'
} as const;
