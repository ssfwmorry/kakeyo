import { type DemoMode, isDemoMode } from '@/features/demo';

// 署名付きデモ Cookie（認証基盤）。
// デモは不特定多数に公開する想定のため、ログインから各画面の取得・更新まで Supabase Auth・DB に
// 一切触れさせない（Auth への認証リクエストが青天井になる・全リクエストが DB を叩く、を塞ぐ）。
// そのためデモログインは実アカウントを持たず、この Cookie の有無だけでデモセッションを成立させる。
// 値は `<base64url(payload)>.<base64url(hmac)>`。payload は { mode, exp }（exp は秒）。
// 署名の目的は改ざん検知のみ（mode は機密ではないため暗号化しない）。
//
// proxy と Server Component の双方で検証するため server-only を付けず、node:crypto ではなく
// WebCrypto（globalThis.crypto.subtle）を使う。秘密鍵は SESSION_SECRET だが、env.server.ts は
// server-only のため proxy から import できず、鍵は呼び出し側から受け取る。

export const DEMO_SESSION_COOKIE = 'demo-session';

// 有効期限（1 日）。切れたら login からやり直す。
export const DEMO_SESSION_MAX_AGE_SEC = 60 * 60 * 24;

type DemoSessionPayload = {
  mode: DemoMode;
  exp: number;
};

const encoder = new TextEncoder();

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// 戻り値は ArrayBuffer 裏付けの Uint8Array（subtle.verify の BufferSource 制約を満たす）。
function fromBase64Url(text: string): Uint8Array<ArrayBuffer> | null {
  try {
    const normalized = text.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}

// mode を載せた署名付き Cookie 値を作る。
export async function signDemoSession(
  mode: DemoMode,
  secret: string,
  nowMs: number = Date.now()
): Promise<string> {
  const payload: DemoSessionPayload = {
    mode,
    exp: Math.floor(nowMs / 1000) + DEMO_SESSION_MAX_AGE_SEC
  };
  const encodedPayload = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(encodedPayload)
  );
  return `${encodedPayload}.${toBase64Url(new Uint8Array(signature))}`;
}

// Cookie 値を検証し、署名・期限・形式が全て正しいときだけ mode を返す。
// 改ざん・期限切れ・形式不正はすべて null（= デモではない）に倒す。
export async function verifyDemoSession(
  value: string,
  secret: string,
  nowMs: number = Date.now()
): Promise<DemoMode | null> {
  const [encodedPayload, encodedSignature, ...rest] = value.split('.');
  if (!encodedPayload || !encodedSignature || rest.length > 0) {
    return null;
  }
  const signature = fromBase64Url(encodedSignature);
  if (!signature) {
    return null;
  }

  // subtle.verify は定数時間比較のため、署名の照合を自前で書かない。
  const key = await importHmacKey(secret);
  const isValid = await crypto.subtle.verify(
    'HMAC',
    key,
    signature,
    encoder.encode(encodedPayload)
  );
  if (!isValid) {
    return null;
  }

  const payload = parsePayload(encodedPayload);
  if (!payload || payload.exp * 1000 <= nowMs) {
    return null;
  }
  return payload.mode;
}

function parsePayload(encodedPayload: string): DemoSessionPayload | null {
  const bytes = fromBase64Url(encodedPayload);
  if (!bytes) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('mode' in parsed) ||
      !('exp' in parsed) ||
      !isDemoMode(parsed.mode) ||
      typeof parsed.exp !== 'number'
    ) {
      return null;
    }
    return { mode: parsed.mode, exp: parsed.exp };
  } catch {
    return null;
  }
}

// proxy / Server Component 共通の検証入口。Cookie 無し・秘密鍵無しは null。
// proxy と session の判定がずれると片方だけがログイン扱いにしてリダイレクトループになるため、
// 判定はここ 1 箇所に寄せる（秘密鍵は呼び出し側が env から渡す）。
export async function verifyDemoSessionCookie(
  value: string | undefined,
  secret: string | undefined
): Promise<DemoMode | null> {
  if (!value || !secret) {
    return null;
  }
  return verifyDemoSession(value, secret);
}

// Cookie 属性。httpOnly（JS から読ませない）+ lax + 本番のみ secure。
export const DEMO_SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: DEMO_SESSION_MAX_AGE_SEC
} as const;
