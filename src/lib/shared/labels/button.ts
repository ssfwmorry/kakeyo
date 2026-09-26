// 汎用ボタン・操作ラベル（全 feature 横断）。
// ドメインに依らない基本操作（保存・削除・編集・並べ替え・色）の単一の正。

export const buttonLabels = {
  save: '保存',
  // 新規/編集で出し分ける主ボタンの文言。今どちらをしているかが読めるよう、
  // フォームの主ボタンは save ではなくこちらを使う。
  create: '登録',
  update: '変更',
  delete: '削除',
  edit: '編集',
  sort: '並べ替え',
  cancel: 'キャンセル',
  color: '色'
} as const;
