import { describe, expect, it } from 'vitest';
import { RecordType } from '@/lib/shared/types/recordType';
import { resolvePlannedRecordOwnership } from './planned-record-fields';

// 旧 Nuxt upsertPlannedRecord の user_id / pair_id / record_type 分岐との等価性を固定する。

const userUid = 'user-uid-0000000000000000000';
const pairId = 10;

describe('resolvePlannedRecordOwnership', () => {
  it('個人（SELF）: user_id のみ・record_type=0', () => {
    expect(
      resolvePlannedRecordOwnership({
        userUid,
        pairId: null,
        isPair: false,
        isInstead: false
      })
    ).toEqual({ userId: userUid, pairId: null, recordType: RecordType.self });
  });

  it('個人は isInstead が true でも SELF のまま（旧実装踏襲）', () => {
    expect(
      resolvePlannedRecordOwnership({
        userUid,
        pairId: null,
        isPair: false,
        isInstead: true
      })
    ).toEqual({ userId: userUid, pairId: null, recordType: RecordType.self });
  });

  it('共有・立替（INSTEAD）: user_id と pair_id の両方・record_type=5', () => {
    expect(
      resolvePlannedRecordOwnership({
        userUid,
        pairId,
        isPair: true,
        isInstead: true
      })
    ).toEqual({ userId: userUid, pairId, recordType: RecordType.instead });
  });

  it('共有・非立替（PAIR）: user_id は null・record_type=10', () => {
    expect(
      resolvePlannedRecordOwnership({
        userUid,
        pairId,
        isPair: true,
        isInstead: false
      })
    ).toEqual({ userId: null, pairId, recordType: RecordType.pair });
  });
});
