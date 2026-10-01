import { describe, expect, it } from 'vitest';
import { banks, records } from '@/lib/server/db/schema';
import { buildOwnerScopeWhere, buildScopeWhere } from './scope';
import { toSql } from './test-helpers';

// 条件式そのものではなく「どう絞られるか」の意味を検証する。
// scope の取り違えは他ペアへの情報漏洩に直結するため、生成 SQL と
// バインド値の両方を見る（値が定数として埋め込まれていないことも確認する）。

describe('buildScopeWhere', () => {
  it('ペア未設定なら自分の user_id のみに絞る（pair_id 条件を出さない）', () => {
    const { sql, params } = toSql(
      buildScopeWhere(records, { userUid: 'u1', pairId: null })
    );
    expect(sql).toContain('"user_id"');
    expect(sql).not.toContain('pair_id');
    expect(params).toEqual(['u1']);
  });

  it('ペア設定済みなら user_id または pair_id で絞る', () => {
    const { sql, params } = toSql(
      buildScopeWhere(records, { userUid: 'u1', pairId: 42 })
    );
    expect(sql).toContain('"user_id"');
    expect(sql).toContain('"pair_id"');
    expect(sql).toContain(' or ');
    expect(params).toEqual(['u1', 42]);
  });

  it('スコープ値はバインド変数として渡る（SQL に直接埋め込まない）', () => {
    const { sql } = toSql(
      buildScopeWhere(records, { userUid: "u1' or '1'='1", pairId: 42 })
    );
    expect(sql).not.toContain("1'='1");
  });
});

describe('buildOwnerScopeWhere', () => {
  it('pair を考慮せず自分の user_id のみ', () => {
    const { sql, params } = toSql(
      buildOwnerScopeWhere(banks.userId, { userUid: 'u1' })
    );
    expect(sql).toContain('"user_id"');
    expect(sql).not.toContain('pair_id');
    expect(params).toEqual(['u1']);
  });

  it('個人専用テーブルではペアがあっても pair_id を混ぜない', () => {
    // buildScopeWhere と取り違えると他ペアの口座が見える。
    const { sql } = toSql(
      buildOwnerScopeWhere(banks.userId, { userUid: 'u1' })
    );
    expect(sql).not.toContain('pair_id');
  });
});
