// ペア切替スイッチを出さない（常に個人スコープ）画面の単一の正。
// server 側と client 側の双方から参照するため、server-only を付けず lib/shared に置く。

// ルートセグメント名（route group を除いたパスセグメント）。
export const PAGES_WITHOUT_PAIR = ['calendar', 'records', 'bank'] as const;

// 実ルートのパス表現（先頭スラッシュ付き）。pathname 一致判定に使う。
export const PATHS_WITHOUT_PAIR = PAGES_WITHOUT_PAIR.map(
  (page) => `/${page}`
) as string[];

// ペアモードでスコープが変わる画面（＝トグル時に再検証したいルート）。
// トグルは pathname をクライアントから渡してくるので、サーバはこの既知集合に
// 正規化してから再検証する（setPairMode）。ここに無いパスは安全側＝全体再検証。
export const PAIR_SCOPED_PATHS = [
  '/summary',
  '/note',
  '/plan',
  '/setting'
] as string[];
