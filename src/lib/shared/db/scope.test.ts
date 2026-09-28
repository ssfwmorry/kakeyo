import { describe, expect, it } from 'vitest';
import { buildOwnerScopeWhere, buildScopeWhere } from './scope';

describe('buildScopeWhere', () => {
  it('ペア未設定なら自分の user_id のみに絞る', () => {
    expect(buildScopeWhere({ userUid: 'u1', pairId: null })).toEqual({
      OR: [{ userId: 'u1' }]
    });
  });

  it('ペア設定済みなら user_id または pair_id で絞る', () => {
    expect(buildScopeWhere({ userUid: 'u1', pairId: 42 })).toEqual({
      OR: [{ userId: 'u1' }, { pairId: 42 }]
    });
  });
});

describe('buildOwnerScopeWhere', () => {
  it('pair を考慮せず自分の user_id のみ', () => {
    expect(buildOwnerScopeWhere({ userUid: 'u1' })).toEqual({ userId: 'u1' });
  });
});
