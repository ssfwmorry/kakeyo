import 'server-only';
import { withDemoRead, withDemoWriteVoid } from '@/features/auth/server/demo';
import type { SessionData } from '@/lib/shared/types/auth';
import type { Id } from '@/lib/shared/types/id';
import { err, ok, type Result } from '@/lib/shared/types/result';
import type { MemoError, MemoItem, ShortCutItem } from '../types';
import { demoMemoList, demoShortCutList } from './demo';
import * as memoRepo from './repositories/memo';
import * as shortCutRepo from './repositories/short-cut';

export async function getMemoList(session: SessionData): Promise<MemoItem[]> {
  return withDemoRead(session.isDemo, demoMemoList, () =>
    memoRepo.getMemoList(session)
  );
}

// TODO 追加。isPair のときはペア共有 TODO。pairId 未設定で isPair は矛盾のため弾く。
export async function insertMemo(
  session: SessionData,
  input: { memo: string; isPair: boolean }
): Promise<Result<void, MemoError>> {
  return withDemoWriteVoid(session.isDemo, async () => {
    if (input.isPair && session.pairId === null) {
      return err<MemoError>('pairRequired');
    }
    await memoRepo.insertMemo(session, input);
    return ok(undefined);
  });
}

// TODO 削除。scope 外 or 不存在は notFound。
export async function deleteMemo(
  session: SessionData,
  id: Id
): Promise<Result<void, MemoError>> {
  return withDemoWriteVoid(session.isDemo, async () => {
    const result = await memoRepo.deleteMemo(session, id);
    if (!result.ok) {
      return err<MemoError>(result.error);
    }
    return ok(undefined);
  });
}

// 個人専用一覧。作成/削除は提供せず取得のみ。
export async function getShortCutList(
  session: SessionData
): Promise<ShortCutItem[]> {
  return withDemoRead(session.isDemo, demoShortCutList, () =>
    shortCutRepo.getShortCutList(session)
  );
}
