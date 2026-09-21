// Server Action / サービス層の戻り値の共通型（凍結資産）。
// 呼び出し側が result.ok で成功/失敗を分岐できるよう判別可能ユニオンにする。

export type ApiResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; message: string };

export function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data };
}

export function fail(message: string): ApiResult<never> {
  return { ok: false, message };
}
