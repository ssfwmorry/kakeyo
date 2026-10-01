import { describe, expect, it } from 'vitest';
import { isForeignKeyError } from './errors';

// pg は PostgreSQL のエラーコードを err.code に載せる。
// 23503 = foreign_key_violation（関連データが残っている削除の失敗）。

describe('isForeignKeyError', () => {
  it('PG の 23503 を FK 制約違反と判定する', () => {
    expect(
      isForeignKeyError(Object.assign(new Error('fk'), { code: '23503' }))
    ).toBe(true);
  });

  it('他の PG エラーコードは判定しない', () => {
    expect(
      isForeignKeyError(Object.assign(new Error('nn'), { code: '23502' }))
    ).toBe(false);
  });

  it('code を持たないエラーは判定しない', () => {
    expect(isForeignKeyError(new Error('boom'))).toBe(false);
  });

  it('null / 非オブジェクトでも落ちない', () => {
    expect(isForeignKeyError(null)).toBe(false);
    expect(isForeignKeyError('23503')).toBe(false);
  });
});
