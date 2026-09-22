import 'server-only';
import type { Result } from '@/lib/shared/types/result';
import { ok } from '@/lib/shared/types/result';

// デモ注入の土台（各ドメインが自分のモックを足す）。
// Server 層でデモ判定時にモックを注入する形へ集約する。
// 引数順は 3 関数とも「isDemo → デモ時の値 → 実処理」で統一。
//
// 使い方（各ドメインのサービス層 = 戻りは Result。UI 文言は持たない）:
//   const list = await withDemoRead(session.isDemo, demoTypeList, () =>
//     typeRepository.getList(session)
//   );
//   const result = await withDemoWrite(session.isDemo, demoResult, () =>
//     typeService.upsert(session, input) // Result<T> を返す
//   );
// Server Action 側で toFormResult(result, { success, ... }) → FormActionResult 化する。

// 取得系: デモ時は用意したモックデータを、そうでなければ実処理の結果を返す。
export async function withDemoRead<T>(
  isDemo: boolean,
  demoData: T,
  real: () => Promise<T>
): Promise<T> {
  if (isDemo) {
    return demoData;
  }
  return real();
}

// 更新系: デモ時は DB に触れず成功扱い（no-op）、そうでなければ実処理。
// E は実処理の失敗分類を透過する（デモ成功時は ok なので E は現れない）。
export async function withDemoWrite<T, E = string>(
  isDemo: boolean,
  demoResult: T,
  real: () => Promise<Result<T, E>>
): Promise<Result<T, E>> {
  if (isDemo) {
    return ok<T, E>(demoResult);
  }
  return real();
}

// 更新系（戻り値なし）: デモ時は no-op で成功。E は実処理の失敗分類を透過する。
export async function withDemoWriteVoid<E = string>(
  isDemo: boolean,
  real: () => Promise<Result<void, E>>
): Promise<Result<void, E>> {
  if (isDemo) {
    return ok<void, E>(undefined);
  }
  return real();
}
