import 'server-only';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

// ペアモード（共有 ON/OFF）の単一の正（凍結資産）。
//
// 「見えるデータのスコープが変わる切替」なので、両方のデータを持って出し分けず、
// Cookie に状態を持ち、トグルで再 fetch する。状態とデータが
// 1:1 対応し責務が明快になる。全レーンはこのモジュール経由でモードを読む
// （Cookie 名・既定値・再検証を各レーンで発明させない）。
//
// 注意: これは「共有モードのトグル状態」であり、session.pairId（ペアの有無）とは別。
// pairId が無いユーザに対しては、この値に関わらず呼び出し側で個人スコープに絞る。

const PAIR_MODE_COOKIE = 'pair-mode';

// ペア切替スイッチを出さない画面の単一の正は FE/BE 両用の lib/shared に集約した。
// 後方互換のためここから再 export する（server 側の既存参照を保つ）。実際の出し分けは
// 共通レイアウトの pair-mode-switch が PATHS_WITHOUT_PAIR を使って行う。
export { PAGES_WITHOUT_PAIR } from '@/lib/shared/pair/pages-without-pair';

// 現在のペアモードを Cookie から読む（既定は false = 個人モード）。
// Server Component / Server Action / サービス層から呼ぶ。
export async function getPairMode(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(PAIR_MODE_COOKIE)?.value === 'true';
}

// ペアモードを設定する。トグルの Server Action から呼ぶ。
// 全画面のデータスコープが変わるため、レイアウト全体を再検証して再 fetch させる。
export async function setPairMode(isPair: boolean): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(PAIR_MODE_COOKIE, String(isPair), {
    path: '/',
    sameSite: 'lax',
    httpOnly: true
  });
  revalidatePath('/', 'layout');
}
