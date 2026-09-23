// URL クエリの id（?RECORD=<id> / ?planId=<id> 等）を正の整数として読むヘルパ。
// 不正・0・負は null（＝新規扱い / 無視）。編集導線を持つ複数ページ（note / plan）で
// 同じ受け取り方をするため共有する。
//
// 実データの PK もデモのモック ID も正の連番のため、デモ画面の編集導線でもプリフィルが効く。
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
