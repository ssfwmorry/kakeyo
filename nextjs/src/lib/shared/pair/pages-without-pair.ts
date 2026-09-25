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
  '/setting',
  '/v2/note'
] as string[];

// 「その id の 1 件を編集中」を表すクエリキーの単一の正。
// record / planned_record / plan はいずれも共有か個人かが作成時に決まり後から移せない。
// 編集中にモードを切り替えても対象は編集できず、入力中の値を失うだけなので、
// これらが付いている間はペア切替スイッチを固定する。
// 新規（?planned=new・キー無し）は共有/個人を選べるので対象外。
export const PAIR_LOCKED_QUERY_KEYS = [
  'RECORD',
  'plannedRecordId',
  'planId'
] as string[];
