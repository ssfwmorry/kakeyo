'use server';

import { parseWithZod } from '@conform-to/zod/v4';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/features/auth/server/requireAuth';
import type { RecordError } from '@/features/record';
import { upsertRecord } from '@/features/record/server/services';
import { startOfDayJst, todayJst } from '@/lib/shared/domain/date';
import { L } from '@/lib/shared/labels';
import {
  type FormActionResult,
  toFormResult
} from '@/lib/shared/types/formResult';
import { RecordType } from '@/lib/shared/types/recordType';
import { shortcutRecordSchema } from './schemas/shortcut-record-schema';
import { getCalendarMonth } from './server/services';
import type { CalendarMonthData } from './types';

const CALENDAR_PATH = '/calendar';

// 月移動時のデータ再取得（Client の月ナビから呼ぶ）。表示は純粋読み取りのため
// 副作用はなく、Result ではなく CalendarMonthData を直返しする。
// yearMonth（YYYY-MM）が不正なら当月にフォールバックする（クライアント値を素通ししない）。
export async function getCalendarMonthAction(
  yearMonth: string
): Promise<CalendarMonthData> {
  const session = await requireAuth();
  const normalized = /^\d{4}-\d{2}$/.test(yearMonth)
    ? yearMonth
    : todayJst().slice(0, 7);
  return getCalendarMonth(session, normalized);
}

// record サービスの失敗分類 → トースト文言。
function errorMessage(error: RecordError): string | undefined {
  switch (error) {
    case 'pairRequired':
      return 'ペアが設定されていません';
    case 'notInScope':
      return L.error.notFound;
    default:
      return undefined;
  }
}

// ショートカットからのワンタップ記録。当日（JST）に record を 1 件登録する。
// record_type から isPair / isInstead を導出（self=個人、instead=立替、pair=共有）。
// pair 系ショートカットでペア未設定なら service が pairRequired を返す。
export async function insertRecordFromShortcutAction(
  _prev: FormActionResult | null,
  formData: FormData
): Promise<FormActionResult> {
  const submission = parseWithZod(formData, { schema: shortcutRecordSchema });
  if (submission.status !== 'success') {
    return { submission: submission.reply() };
  }
  const session = await requireAuth();
  const { isPay, methodId, typeId, subTypeId, price, memo, recordType } =
    submission.value;

  const isPair = recordType !== RecordType.self;
  const isInstead = recordType === RecordType.instead;

  const result = await upsertRecord(session, {
    datetime: startOfDayJst(todayJst()),
    isPay,
    methodId,
    isInstead,
    typeId,
    subTypeId,
    price,
    memo,
    isPair
  });
  revalidatePath(CALENDAR_PATH);
  return {
    ...toFormResult<void, RecordError>(result, {
      success: L.snackbar.created,
      errorMessage,
      fallbackError: L.snackbar.failed
    }),
    submission: submission.reply()
  };
}
