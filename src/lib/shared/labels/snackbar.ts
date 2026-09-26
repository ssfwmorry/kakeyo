// 成否通知トーストの共通文言（全 feature 横断）。
// CRUD の成功文言はドメインを問わず同じ（skill-kick の SNACKBAR に相当）。
// 各 feature の Server Action は toFormResult の success/fallbackError にこれを渡す。

export const snackbarLabels = {
  created: '登録しました',
  updated: '変更しました',
  deleted: '削除しました',
  // リマインダーの消化（お知らせの「確認」）。対象名は quoted() で前に付ける。
  checked: '確認しました',
  failed: '処理に失敗しました'
} as const;
