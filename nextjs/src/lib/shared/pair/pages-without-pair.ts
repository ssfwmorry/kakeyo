// ペア切替スイッチを出さない（常に個人スコープ）画面の単一の正（FE/BE 両用）。
// 現行 Nuxt の pagesWithoutPair を踏襲（calendar / records / bank は個人専用）。
//
// server 側（lib/server/pair/mode.ts が再 export）と client 側（共通レイアウトの
// pair-mode-switch）の双方から参照するため、server-only を付けず lib/shared に置く。
// これにより「ペア専用画面を増減する」変更を 1 箇所に閉じる。

// ルートセグメント名（route group を除いたパスセグメント）。
export const PAGES_WITHOUT_PAIR = ['calendar', 'records', 'bank'] as const;

// 実ルートのパス表現（先頭スラッシュ付き）。pathname 一致判定に使う。
export const PATHS_WITHOUT_PAIR = PAGES_WITHOUT_PAIR.map(
  (page) => `/${page}`
) as string[];
