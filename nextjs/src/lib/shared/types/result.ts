// サービス層（DB アクセス）の戻り値の共通型。
// サービス層は「成功したか / 失敗したか（＋分類）」だけを返し、UI 文言は持たない。
// トースト文言の付与は Server Action の責務（toFormResult で FormActionResult 化）。
// これにより DB 層が画面文言を抱える責務混在を避け、変換を 1 箇所に集約する。
//
// error は「何が起きたか」の分類（機械可読）。ユーザ向け文言ではない。
// 各ドメインは必要なら string リテラルユニオンで自分の失敗種別を絞ってよい。

export type Result<T = void, E = string> =
  | { ok: true; data: T }
  | { ok: false; error: E };

// E はデフォルト string。呼び出し側が Result<T, E> の narrow な error 型へ
// 代入する場合に E を明示できるよう generic 化（既存呼び出しは E=string で不変）。
export function ok<T, E = string>(data: T): Result<T, E> {
  return { ok: true, data };
}

export function err<E = string>(error: E): Result<never, E> {
  return { ok: false, error };
}
