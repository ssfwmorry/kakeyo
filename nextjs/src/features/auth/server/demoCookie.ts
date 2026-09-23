import 'server-only';
import { cookies } from 'next/headers';
import {
  DEMO_PAIR_ID,
  DEMO_USER_EMAIL,
  DEMO_USER_UID,
  type DemoMode
} from '@/features/demo';
import { serverEnv } from '@/lib/server/env.server';
import type { SessionData } from '@/lib/shared/types/auth';
import {
  DEMO_SESSION_COOKIE,
  DEMO_SESSION_COOKIE_OPTIONS,
  signDemoSession,
  verifyDemoSessionCookie
} from './demoSession';

// デモ Cookie の Node 側入出力（凍結資産・認証基盤）。next/headers の cookies() 経由で読み書きする
// （proxy は cookies() を使えないため demoSession.ts を直接使う）。

export async function setDemoSession(mode: DemoMode): Promise<void> {
  const cookieStore = await cookies();
  const value = await signDemoSession(mode, serverEnv.sessionSecret);
  cookieStore.set(DEMO_SESSION_COOKIE, value, DEMO_SESSION_COOKIE_OPTIONS);
}

// ログアウト・通常ログイン成功時に呼ぶ。デモは Supabase セッションを持たないため signOut では
// 消えず、残すとデモのまま復帰する。
export async function clearDemoSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(DEMO_SESSION_COOKIE);
}

export async function readDemoMode(): Promise<DemoMode | null> {
  const cookieStore = await cookies();
  return verifyDemoSessionCookie(
    cookieStore.get(DEMO_SESSION_COOKIE)?.value,
    serverEnv.sessionSecret
  );
}

// デモの固定 SessionData。DB 照会を伴わず mode から一意に決まる。
export function toDemoSessionData(mode: DemoMode): SessionData {
  return {
    userUid: DEMO_USER_UID,
    email: DEMO_USER_EMAIL,
    pairId: mode === 'pair' ? DEMO_PAIR_ID : null,
    isDemo: true
  };
}
