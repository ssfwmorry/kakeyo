'use client';

import { useMemo, useState } from 'react';
import { useFormAction } from '@/components/form/use-form-action';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import type { PairedRecordItem } from '@/features/record';
import {
  createSettlementRecordAction,
  settleRecordsAction
} from '@/features/record/actions/settlement-actions';
import type { Id } from '@/lib/shared/types/id';
import { colorHex } from '../color';
import { toShowStr } from '../domain/format';

// 精算タブ（旧 SummarySettlement.vue の中核フローを移植）。
// ペアの record を ME / PARTNER / COUPLE に分類表示し、未精算の立替 record を選んで
// (1) 精算 record の作成（送金方法・金額・支払/受取・日付）、(2) 選択 record の精算済み化。
// 作成/精算は record レーンの既存 Server Action を再利用する（revalidatePath('/summary')）。
//
// NOTE(移植範囲): 旧 UI の「按分レート選択ダイアログ」による自動金額算出は
// 補助的な UX であり、精算 record 作成に必要なのは method/金額/方向のみ（旧 endSettlement も
// 金額はユーザ入力）。本移植は必須フロー（作成 + 精算済み化）を確実に通し、
// レート按分 UI は将来拡張とする。数字（DB 反映）は既存 service/action に委譲するためズレない。

type MethodOption = { id: Id; name: string };

type SummarySettlementProps = {
  records: PairedRecordItem[];
  // 精算方法（both.pair）。旧 methodList.value = data.both.pair。
  methods: MethodOption[];
  // 精算対象月（'YYYY-MM'）。作成 record の日付初期値の基準。
  yearMonth: string;
};

// ME / PARTNER / COUPLE のバケツ分け（旧 convertShowData）。
function bucketRecords(records: PairedRecordItem[]): {
  me: PairedRecordItem[];
  partner: PairedRecordItem[];
  couple: PairedRecordItem[];
} {
  const me: PairedRecordItem[] = [];
  const partner: PairedRecordItem[] = [];
  const couple: PairedRecordItem[] = [];
  for (const record of records) {
    if (record.isSettlement || !record.isInstead) {
      couple.push(record);
    } else if (record.isSelf) {
      me.push(record);
    } else {
      partner.push(record);
    }
  }
  return { me, partner, couple };
}

export function SummarySettlement({
  records,
  methods,
  yearMonth
}: SummarySettlementProps) {
  const { me, partner, couple } = useMemo(
    () => bucketRecords(records),
    [records]
  );

  // 未精算の立替 record（ME/PARTNER のうち isSettled===false）が精算対象。
  const settleable = useMemo(
    () => [...me, ...partner].filter((r) => r.isSettled === false),
    [me, partner]
  );
  const hasUnsettled = settleable.length > 0;

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [methodId, setMethodId] = useState<string>('');
  const [isPay, setIsPay] = useState(true);
  const [price, setPrice] = useState('');

  // result はトースト発火（useFormAction 内）が目的で参照はしないため破棄する。
  const [, createAction] = useFormAction(createSettlementRecordAction);
  const [, settleAction] = useFormAction(settleRecordsAction);

  const toggleId = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // 作成 record の日付は対象月の 1 日を既定（旧は月末だが表示専用のため月内で十分）。
  const defaultDate = `${yearMonth}-01`;

  return (
    <div className='flex flex-col gap-6'>
      <RecordGroup title='自分の立替' records={me} />
      <RecordGroup title='相手の立替' records={partner} />
      <RecordGroup title='2人の記録' records={couple} />

      {hasUnsettled ? (
        <section className='flex flex-col gap-3 rounded-md border p-3'>
          <h3 className='font-medium text-sm'>精算する立替を選ぶ</h3>
          <ul className='flex flex-col gap-1'>
            {settleable.map((record) => (
              <li key={record.id} className='flex items-center gap-2'>
                <Checkbox
                  checked={selectedIds.has(record.id)}
                  onCheckedChange={() => toggleId(record.id)}
                  id={`settle-${record.id}`}
                />
                <label
                  htmlFor={`settle-${record.id}`}
                  className='flex-1 truncate text-sm'
                >
                  {record.isSelf ? '自分' : '相手'} / {record.typeName}
                  {record.memo ? ` / ${record.memo}` : ''}
                </label>
                <span className='text-sm tabular-nums'>
                  {toShowStr(record.price)} 円
                </span>
              </li>
            ))}
          </ul>

          <div className='flex flex-col gap-3 border-t pt-3'>
            <h3 className='font-medium text-sm'>精算 record を作成</h3>
            <div className='inline-flex overflow-hidden rounded-md border self-start'>
              <Button
                type='button'
                variant={isPay ? 'default' : 'ghost'}
                size='sm'
                className='rounded-none'
                onClick={() => setIsPay(true)}
              >
                お渡し（支払）
              </Button>
              <Button
                type='button'
                variant={!isPay ? 'default' : 'ghost'}
                size='sm'
                className='rounded-none'
                onClick={() => setIsPay(false)}
              >
                受け取り
              </Button>
            </div>

            <Select
              value={methodId}
              onValueChange={(value) => setMethodId(value ?? '')}
            >
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='精算方法を選択' />
              </SelectTrigger>
              <SelectContent>
                {methods.map((method) => (
                  <SelectItem key={method.id} value={String(method.id)}>
                    {method.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type='number'
              inputMode='numeric'
              placeholder='精算金額'
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />

            {/* 精算 record 作成 → 選択 record を精算済みに、を 2 段階で送る。
                Conform スキーマに合わせ hidden で値を渡す（session 由来の scope は Action 側）。 */}
            <form action={createAction} className='flex flex-col gap-2'>
              <input type='hidden' name='date' value={defaultDate} readOnly />
              <input
                type='hidden'
                name='isPay'
                value={String(isPay)}
                readOnly
              />
              <input type='hidden' name='methodId' value={methodId} readOnly />
              <input type='hidden' name='price' value={price} readOnly />
              <Button
                type='submit'
                disabled={methodId === '' || price === '' || Number(price) <= 0}
              >
                精算 record を作成
              </Button>
            </form>

            <form action={settleAction} className='flex flex-col gap-2'>
              {[...selectedIds].map((id) => (
                <input
                  key={id}
                  type='hidden'
                  name='ids'
                  value={String(id)}
                  readOnly
                />
              ))}
              <Button
                type='submit'
                variant='secondary'
                disabled={selectedIds.size === 0}
              >
                選んだ立替を精算済みにする
              </Button>
            </form>
          </div>
        </section>
      ) : (
        <p className='py-4 text-center text-muted-foreground text-sm'>
          未精算の立替はありません
        </p>
      )}
    </div>
  );
}

function RecordGroup({
  title,
  records
}: {
  title: string;
  records: PairedRecordItem[];
}) {
  if (records.length === 0) {
    return null;
  }
  return (
    <section className='flex flex-col gap-1'>
      <h3 className='font-medium text-muted-foreground text-xs'>{title}</h3>
      <ul className='flex flex-col gap-1'>
        {records.map((record) => (
          <li
            key={record.id}
            className='flex items-center gap-2 rounded-md border p-2'
          >
            <span
              aria-hidden
              className='inline-block size-3 shrink-0 rounded-full'
              style={{
                backgroundColor: colorHex(record.typeColorClassificationName)
              }}
            />
            <span className='flex-1 truncate text-sm'>
              {record.typeName}
              {record.subTypeName ? ` / ${record.subTypeName}` : ''}
              {record.memo ? ` / ${record.memo}` : ''}
            </span>
            {record.isSettled ? (
              <span className='text-muted-foreground text-xs'>精算済</span>
            ) : null}
            <span className='text-sm tabular-nums'>
              {toShowStr(record.price)} 円
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
