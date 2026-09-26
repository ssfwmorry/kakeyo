import { describe, expect, it } from 'vitest';
import { DemoMode } from '@/features/demo';
import {
  DEMO_SESSION_MAX_AGE_SEC,
  signDemoSession,
  verifyDemoSession
} from './demoSession';

const secret = 'test-secret-key-for-demo-session';
const now = Date.UTC(2026, 8, 23, 3, 0, 0);

describe('signDemoSession / verifyDemoSession', () => {
  it('署名した値は同じ秘密鍵で検証でき mode が戻る', async () => {
    const pair = await signDemoSession(DemoMode.pair, secret, now);
    const solo = await signDemoSession(DemoMode.solo, secret, now);
    expect(await verifyDemoSession(pair, secret, now)).toBe(DemoMode.pair);
    expect(await verifyDemoSession(solo, secret, now)).toBe(DemoMode.solo);
  });

  it('秘密鍵が違えば null', async () => {
    const value = await signDemoSession(DemoMode.pair, secret, now);
    expect(await verifyDemoSession(value, 'another-secret', now)).toBeNull();
  });

  it('payload を改ざんすると署名不一致で null', async () => {
    const value = await signDemoSession(DemoMode.solo, secret, now);
    const [, signature] = value.split('.');
    const forged = `${btoa(
      JSON.stringify({ mode: 'pair', exp: 4102444800 })
    ).replace(/=+$/, '')}.${signature}`;
    expect(await verifyDemoSession(forged, secret, now)).toBeNull();
  });

  it('期限切れは null', async () => {
    const value = await signDemoSession(DemoMode.pair, secret, now);
    const expired = now + (DEMO_SESSION_MAX_AGE_SEC + 1) * 1000;
    expect(await verifyDemoSession(value, secret, expired)).toBeNull();
  });

  it('形式不正は null', async () => {
    expect(await verifyDemoSession('', secret, now)).toBeNull();
    expect(await verifyDemoSession('abc', secret, now)).toBeNull();
    expect(await verifyDemoSession('a.b.c', secret, now)).toBeNull();
    expect(await verifyDemoSession('!!!.???', secret, now)).toBeNull();
  });
});
