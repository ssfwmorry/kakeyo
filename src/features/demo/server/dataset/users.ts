import 'server-only';
import { DEMO_PAIR_ID, DEMO_USER_UID } from '../../shared/mode';

// users / pairs。デモの世界には「自分（たろう）」と「ペア相手（はなこ）」の 2 人がいて
// 1 つのペアを組んでいる。solo デモは同じ世界を「ペアを組んでいない」ものとして見る
// （scope.ts の可視判定で pair 行が見えなくなる）。

export type DemoUser = {
  uid: string;
  name: string;
};

export const demoUsers = {
  self: { uid: DEMO_USER_UID, name: 'たろう' },
  partner: { uid: 'demo-partner', name: 'はなこ' }
} as const satisfies Record<string, DemoUser>;

export const demoPair = {
  id: DEMO_PAIR_ID,
  userUids: [demoUsers.self.uid, demoUsers.partner.uid]
} as const;

// users.name 相当。record / summary の立替者名・精算相手の表示に使う。
export function findDemoUserName(uid: string | null): string | null {
  if (uid === demoUsers.self.uid) {
    return demoUsers.self.name;
  }
  if (uid === demoUsers.partner.uid) {
    return demoUsers.partner.name;
  }
  return null;
}

// 所有者列（user_id / pair_id）の定型。実 DB の多くのテーブルはこの 2 列の「どちらか一方」を
// 持つ（lib/shared/db/scope.ts）。各テーブルの行はこれをスプレッドして所有者を表す。
export type Owned = {
  userUid: string | null;
  pairId: number | null;
};

export const owner = {
  // 自分の個人データ。
  self: { userUid: demoUsers.self.uid, pairId: null },
  // 相手の個人データ（自分には見えない。相手の立替 record が参照する方法など）。
  partner: { userUid: demoUsers.partner.uid, pairId: null },
  // ペア共有データ（user_id を持たない）。
  pair: { userUid: null, pairId: demoPair.id }
} as const satisfies Record<string, Owned>;
