import 'server-only';
import type { SessionData } from '@/lib/shared/types/auth';
import type { Result } from '@/lib/shared/types/result';
import { ok } from '@/lib/shared/types/result';

// デモ注入のヘルパ。各 feature のサービス層は取得を withDemoRead、更新を withDemoWriteVoid に
// 通す（デモは実 DB へ触れず、取得 = dataset の射影 / 更新 = no-op 成功）。
// 引数順は「session → デモ時の処理 → 実処理」で統一。
//
// 使い方:
//   const list = await withDemoRead(
//     session,
//     () => demoTypeMethod.getTypeCardList(session),
//     () => typeService.getTypeCardList(session)
//   );
//   const result = await withDemoWriteVoid(session, () => typeRepo.update(...));
//
// デモ側は thunk で受ける。非デモの実リクエストでモックの組み立て（filter / sort）を
// 走らせないためで、モジュールに直書きした定数を渡すときも () => value で包む。

type DemoSession = Pick<SessionData, 'isDemo'>;

// 取得系: デモ時は dataset からの射影を、そうでなければ実処理の結果を返す。
export async function withDemoRead<T>(
  session: DemoSession,
  demo: () => T,
  real: () => Promise<T>
): Promise<T> {
  if (session.isDemo) {
    return demo();
  }
  return real();
}

// 更新系（戻り値なし）: デモ時は DB に触れず成功扱い（no-op）、そうでなければ実処理。
// E は実処理の失敗分類を透過する（デモ成功時は ok なので E は現れない）。
export async function withDemoWriteVoid<E = string>(
  session: DemoSession,
  real: () => Promise<Result<void, E>>
): Promise<Result<void, E>> {
  if (session.isDemo) {
    return ok<void, E>(undefined);
  }
  return real();
}
