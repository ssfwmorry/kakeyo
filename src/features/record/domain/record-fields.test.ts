import { describe, expect, it } from 'vitest';
import { RecordType } from '@/lib/shared/types/recordType';
import {
  isPartnerInstead,
  resolveRecordOwnership,
  resolveScopeLocked
} from './record-fields';

// record の所有者・精算フラグ・record_type 導出の単体テスト。

const UID = 'user-uid';
const PAIR_ID = 42;

describe('resolveRecordOwnership', () => {
  it('個人（!isPair）は SELF・user_id 保持・pair なし・精算なし', () => {
    expect(
      resolveRecordOwnership({
        userUid: UID,
        pairId: PAIR_ID,
        isPair: false,
        isInstead: false
      })
    ).toEqual({
      userId: UID,
      pairId: null,
      isSettled: null,
      recordType: RecordType.self
    });
  });

  it('共有・立替（isPair && isInstead）は INSTEAD・user_id と pair 保持・is_settled=false', () => {
    expect(
      resolveRecordOwnership({
        userUid: UID,
        pairId: PAIR_ID,
        isPair: true,
        isInstead: true
      })
    ).toEqual({
      userId: UID,
      pairId: PAIR_ID,
      isSettled: false,
      recordType: RecordType.instead
    });
  });

  it('共有・非立替（isPair && !isInstead）は PAIR・user_id なし・pair 保持・精算なし', () => {
    expect(
      resolveRecordOwnership({
        userUid: UID,
        pairId: PAIR_ID,
        isPair: true,
        isInstead: false
      })
    ).toEqual({
      userId: null,
      pairId: PAIR_ID,
      isSettled: null,
      recordType: RecordType.pair
    });
  });
});

describe('isPartnerInstead', () => {
  it('相手が立て替えた記録だけ該当する', () => {
    expect(isPartnerInstead({ isSelf: false, isInstead: true })).toBe(true);
  });

  it('共有の記録は相手が起票していても二人のお金なので該当しない', () => {
    expect(isPartnerInstead({ isSelf: false, isInstead: false })).toBe(false);
  });

  it('自分の立替は該当しない', () => {
    expect(isPartnerInstead({ isSelf: true, isInstead: true })).toBe(false);
  });

  it('個人の記録は立替の概念が無い（isInstead=null）', () => {
    expect(isPartnerInstead({ isSelf: true, isInstead: null })).toBe(false);
  });
});

describe('resolveScopeLocked', () => {
  it('個人 record は移せる（精算に関与しない）', () => {
    expect(
      resolveScopeLocked({ isInstead: false, isSettled: null, isSelf: true })
    ).toBe(false);
  });

  it('共有の非立替（PAIR）は移せる', () => {
    expect(
      resolveScopeLocked({ isInstead: false, isSettled: null, isSelf: false })
    ).toBe(false);
  });

  it('自分の未精算の立替は移せる', () => {
    expect(
      resolveScopeLocked({ isInstead: true, isSettled: false, isSelf: true })
    ).toBe(false);
  });

  it('精算済みの立替は移せない（精算済み金額の裏付けが消えるため）', () => {
    expect(
      resolveScopeLocked({ isInstead: true, isSettled: true, isSelf: true })
    ).toBe(true);
  });

  it('ペア相手が起票した立替は移せない', () => {
    expect(
      resolveScopeLocked({ isInstead: true, isSettled: false, isSelf: false })
    ).toBe(true);
  });
});
