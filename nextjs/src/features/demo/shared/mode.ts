// デモモードの共有定義（認証基盤）。server-only を含まない。
// login フォーム（Client）が mode を Server Action へ渡し、proxy / session が Cookie を
// 検証するため、型と固定値はここに置いて server / client / proxy の三者で共有する。

// デモの種類。pair = ペアありアカウント / solo = ペアなしアカウント。
// ログイン時に確定し、アプリ内では切り替えない（session.pairId の有無として現れる）。
export const DemoMode = {
  pair: 'pair',
  solo: 'solo'
} as const;

export type DemoMode = (typeof DemoMode)[keyof typeof DemoMode];

// Server Action に渡る mode はクライアント由来のため、この判定を通してから使う。
export function isDemoMode(value: unknown): value is DemoMode {
  return value === DemoMode.pair || value === DemoMode.solo;
}

// デモの固定セッション値。デモは DB に届かないため実在ユーザ・実 pair と衝突しない。
// データセット側（server/dataset/users.ts）の自分・ペアもこの値を使う。
export const DEMO_USER_UID = 'demo-user';
export const DEMO_PAIR_ID = 1;
// 実在アカウントではないダミー email（SessionData.email の形式を満たすためだけの値）。
export const DEMO_USER_EMAIL = 'demo@example.com';
