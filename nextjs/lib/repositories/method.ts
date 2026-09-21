import 'server-only';
import type { SessionScope } from '@/lib/types/auth';
import type { Id } from '@/lib/types/id';

// L4 method レーンの「被参照 I/F」先置きスタブ（凍結資産の I/F 部分）。
// L2 record / L6 summary が参照するため型のみ先に確定。中身は L4 が実装する。

// is_pay は送金方法（both）の場合 null。
export type MethodSummary = {
  id: Id;
  name: string;
  isPay: boolean | null;
  colorClassificationId: Id;
};

const notImplemented = (name: string) =>
  new Error(
    `methodRepository.${name} は L4 エージェントが実装します（I/F スタブ）`
  );

// READ
export async function getMethodList(
  _scope: SessionScope
): Promise<MethodSummary[]> {
  throw notImplemented('getMethodList');
}
