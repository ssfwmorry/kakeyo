import 'server-only';
import type { ApiResult } from '@/lib/types/apiResult';
import { ok } from '@/lib/types/apiResult';

// デモ注入の土台（凍結資産の骨組み。各ドメインが自分のモックを足す）。
// 旧 `if (isDemoLogin) return DEMO_DATA...` の散在を解消し、Server 層でデモ判定時に
// モックを注入する形へ集約する。引数順は 3 関数とも「isDemo → デモ時の値 → 実処理」で統一。
//
// 使い方（各ドメインのサービス層）:
//   const list = await withDemoRead(session.isDemo, demoTypeList, () =>
//     typeRepository.getList(session)
//   );
//   const result = await withDemoWrite(session.isDemo, demoResult, () =>
//     typeRepository.upsert(session, input)
//   );

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
export async function withDemoWrite<T>(
  isDemo: boolean,
  demoResult: T,
  real: () => Promise<ApiResult<T>>
): Promise<ApiResult<T>> {
  if (isDemo) {
    return ok(demoResult);
  }
  return real();
}

// 更新系（戻り値なし）: デモ時は no-op で成功。
export async function withDemoWriteVoid(
  isDemo: boolean,
  real: () => Promise<ApiResult>
): Promise<ApiResult> {
  if (isDemo) {
    return ok(undefined);
  }
  return real();
}
