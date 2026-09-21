import 'server-only';
import type { SessionScope } from '@/lib/types/auth';
import type { Id } from '@/lib/types/id';

// L4 type/method レーンの「被参照 I/F」先置きスタブ（凍結資産の I/F 部分）。
// L2 record / L6 summary / L8 shortcut が参照するため、シグネチャと戻り型だけを
// 先に確定し中身は L4 が実装する。
// 【L4 実装者へ】型・シグネチャは他レーンの前提。変更が要る場合はオーケストレータへ。
// 取得系は必ず buildScopeWhere を通すこと。

// 整形済みカテゴリ（サブカテゴリ・色込み）。詳細な整形（income/pay × self/pair の
// グルーピング）は L4 で決めるが、他レーンが参照する最小の形をここで固定する。
export type TypeWithSubTypes = {
  id: Id;
  name: string;
  isPay: boolean;
  colorClassificationId: Id;
  subTypes: SubTypeSummary[];
};

export type SubTypeSummary = {
  id: Id;
  name: string;
};

const notImplemented = (name: string) =>
  new Error(
    `typeRepository.${name} は L4 エージェントが実装します（I/F スタブ）`
  );

// READ
export async function getTypeList(
  _scope: SessionScope
): Promise<TypeWithSubTypes[]> {
  throw notImplemented('getTypeList');
}
