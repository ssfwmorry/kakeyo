// URL クエリの id（?RECORD=<id> / ?planId=<id> 等）を正の整数として読むヘルパ。
// 不正・0・負は null（＝新規扱い / 無視）。編集導線を持つ複数ページ（note / plan）で
// 同じ受け取り方をするため共有する。
//
// NOTE: 実データの PK は常に正の連番。デモのモックは負 ID を使う規約（entityId.ts 参照）
// のため、デモ画面から負 ID がクエリに乗ると新規扱いに落ちる（プリフィルされない）。
// これはデモ由来の既知の制約で、実データ（正 ID）では編集プリフィルが機能する。
export function parseQueryId(value: string | undefined): number | null {
  if (value === undefined) {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}
