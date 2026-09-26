import 'server-only';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import {
  PAIR_SCOPED_PATHS,
  PATHS_WITHOUT_PAIR
} from '@/lib/shared/pair/pages-without-pair';
import type { SessionData } from '@/lib/shared/types/auth';

// ペアモード（共有 ON/OFF）の単一の正。
//
// 「見えるデータのスコープが変わる切替」なので、両方のデータを持って出し分けず、
// Cookie に状態を持ち、トグルで再 fetch する。状態とデータが
// 1:1 対応し責務が明快になる。モードは必ずこのモジュール経由で読む
// （Cookie 名・既定値・再検証を呼び出し側で発明させない）。
//
// 注意: これは「共有モードのトグル状態」であり、session.pairId（ペアの有無）とは別。
// pairId が無いユーザに対しては、この値に関わらず呼び出し側で個人スコープに絞る。

const PAIR_MODE_COOKIE = 'pair-mode';

// server 側の既存参照を保つための再 export（定義は lib/shared 側が持つ）。
export { PAGES_WITHOUT_PAIR } from '@/lib/shared/pair/pages-without-pair';

// 現在のペアモードを Cookie から読む（既定は false = 個人モード）。
// Server Component / Server Action / サービス層から呼ぶ。
export async function getPairMode(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(PAIR_MODE_COOKIE)?.value === 'true';
}

// 画面のスコープ判定に使う実効ペアモード。pairId が無いユーザは Cookie に関わらず個人スコープ固定
// （ペア解消やアカウント切替後に残った ON が、空の pair 側を指すのを防ぐ）。
// 切替スイッチ自体の表示状態が要る layout だけは生の getPairMode を使う。
export async function getEffectivePairMode(
  session: Pick<SessionData, 'pairId'>
): Promise<boolean> {
  return session.pairId !== null && (await getPairMode());
}

// ペアモードを設定する。トグルの Server Action から呼ぶ。
//
// 再検証は「今いる画面」だけに絞る（pathname）。'/' を layout 再検証すると未表示の
// 全ルートまで再 fetch され、登録を急ぐ場面でトグルが重くなるため。
// 他ルートは遷移時に Cookie の新しい値でレンダされるので取り違えは起きない。
//
// 対象パスは 'layout' で再検証する。page だけだと共通レイアウト（(private)/layout）の
// isPair が古いままになり、本文は新スコープなのにヘッダのトグルが元の位置に戻る
// （= 楽観更新が巻き戻って見える）ため、両者を同じ再検証単位に載せる。
//
// pathname はクライアント由来なので、サーバが知っている集合に正規化してから使う。
// 個人専用画面はモードの影響を受けないので再検証を省き、未知のパスは安全側
// （レイアウト全体の再検証）へ倒す。最適化が外れても正しさは壊れない。
export async function setPairMode(
  isPair: boolean,
  pathname: string
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(PAIR_MODE_COOKIE, String(isPair), {
    path: '/',
    sameSite: 'lax',
    httpOnly: true
  });

  if (PATHS_WITHOUT_PAIR.includes(pathname)) {
    return;
  }
  const scoped = PAIR_SCOPED_PATHS.find(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
  if (scoped !== undefined) {
    revalidatePath(scoped, 'layout');
    return;
  }
  revalidatePath('/', 'layout');
}
