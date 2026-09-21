import 'server-only';
import type { SessionScope } from '@/lib/types/auth';
import type { Id } from '@/lib/types/id';
import type { RecordType } from '@/lib/types/recordType';

// L2 record レーンの「被参照 I/F」先置きスタブ（凍結資産の I/F 部分）。
// L3 定期+Cron が INSERT I/F を、L6 summary/records が取得系を参照するため
// 型とシグネチャを先に確定する。中身（Prisma ORM / $queryRaw）は L2 が実装する。
// 【L2 実装者へ】取得系は必ず buildScopeWhere を通すこと。record_type は
// resolveRecordType で算出すること（自前で 0/5/10/15 を書かない）。

// records への INSERT 入力（L3 の実体化バッチが使う最小の形）。
// record_type は resolveRecordType 済みの値を渡す前提。
export type RecordInsertInput = {
  userId: string;
  pairId: Id | null;
  datetime: Date;
  isPay: boolean | null;
  methodId: Id;
  typeId: Id | null;
  subTypeId: Id | null;
  price: number;
  memo: string | null;
  plannedRecordId: Id | null;
  isSettled: boolean | null;
  recordType: RecordType;
};

const notImplemented = (name: string) =>
  new Error(
    `recordRepository.${name} は L2 エージェントが実装します（I/F スタブ）`
  );

// CREATE
// 定期実体化（L3 Cron）などからのまとめ INSERT。scope は所有者確定用。
export async function insertRecords(
  _scope: SessionScope,
  _inputs: RecordInsertInput[]
): Promise<void> {
  throw notImplemented('insertRecords');
}
