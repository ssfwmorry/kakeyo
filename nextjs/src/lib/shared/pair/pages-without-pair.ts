// ペア切替スイッチを出さない（常に個人スコープ）画面の単一の正。
// server 側と client 側の双方から参照するため、server-only を付けず lib/shared に置く。

// ルートセグメント名（route group を除いたパスセグメント）。
export const PAGES_WITHOUT_PAIR = ['bank'] as const;

// 実ルートのパス表現（先頭スラッシュ付き）。pathname 一致判定に使う。
export const PATHS_WITHOUT_PAIR = PAGES_WITHOUT_PAIR.map(
  (page) => `/${page}`
) as string[];

// ペアモードでスコープが変わる画面（＝トグル時に再検証したいルート）。
// トグルは pathname をクライアントから渡してくるので、サーバはこの既知集合に
// 正規化してから再検証する（setPairMode）。ここに無いパスは安全側＝全体再検証。
// カレンダーは記録・予定のシートを持ち、個人｜共有で候補が変わる。
// 設定は配下の詳細画面（/setting/type など）も含めて layout 単位で再検証する。
export const PAIR_SCOPED_PATHS = [
  '/calendar',
  '/summary',
  '/setting'
] as string[];
