import { describe, expect, it } from 'vitest';
import { RecordType } from '@/lib/shared/types/recordType';
import { resolveRecordOwnership } from './record-fields';

// record の所有者・精算フラグ・record_type 導出の単体テスト（旧 upsertRecord 分岐）。
// ※ 現行 vitest.config.mts の include は src/lib/** のためこのファイルはデフォルト
//   実行対象外だが、ドメイン分岐の意図を固定する回帰テストとして併置する。

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
