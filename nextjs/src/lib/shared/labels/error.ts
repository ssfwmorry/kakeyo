// 汎用エラー文言（全 feature 横断・凍結資産）。
// ドメインに依らない失敗分類の文言。feature 固有の失敗（「口座が〜」等）は
// 各 feature の labels.ts に置き、ここには共通のものだけを集約する。

export const errorLabels = {
  // FK 制約違反（紐づくデータがあり削除できない）。CRUD 全般で共通。
  hasRelatedData: '紐づくデータがあるので削除できません',
  // 対象が scope 外 or 不存在。
  notFound: '対象が見つかりません'
} as const;
