import 'server-only';
import type { MemoItem } from '@/features/memo/types';
import type { SessionScope } from '@/lib/shared/types/auth';
import { memoRows } from '../dataset/memos';
import { visibleTo } from '../dataset/scope';

// memo（TODO）のデモ射影。

export function getMemoList(scope: SessionScope): MemoItem[] {
  return visibleTo(scope, memoRows).map((row) => ({
    id: row.id,
    memo: row.memo,
    isPair: row.pairId !== null
  }));
}
