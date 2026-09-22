'use client';

import { useMemo, useState } from 'react';
import { useFormAction } from '@/components/form/use-form-action';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  createSettlementRecordAction,
  type PairedRecordItem,
  settleRecordsAction
} from '@/features/record';
import type { Id } from '@/lib/shared/types/id';
import { colorHex } from '../color';
import { toShowStr } from '../domain/format';
import {
  collectAssignedIds,
  type RateAssignment,
  resolveSettlement,
  summarizeByRate
} from '../domain/settlement';
import {
  RATE_COLOR_LIST,
  RATE_LABEL_LIST,
  RATE_LIST
} from '../domain/settlement-rate';

// 精算タブ。ペアの record を ME / PARTNER / COUPLE に分類表示し、未精算の立替 record ごとに
// 按分レート（10:0〜0:10）を割り当てる。レート別に「合計/現状/あるべき」を集計し、
// 差額の総和から自動で「◯◯円のお渡し/受け取り」を提示する。
// 確定すると精算 record を作成し、対象 record を精算済みにする。
//
// 3 ステップ:
//  - READY: record 一覧の確認。「精算をはじめる」でレート割当へ。
//  - GOING: 未精算立替へレート割当 → 差額を自動算出。「精算内容を確定」で送金入力へ。
//  - DONE : 精算方法を選び、算出済みの金額・方向で精算 record 作成 + 精算済み化。
//
// 金額・方向はレート按分から算出するため手入力しない。

type MethodOption = { id: Id; name: string };

type Step = 'ready' | 'going' | 'done';

type SummarySettlementProps = {
  records: PairedRecordItem[];
  methods: MethodOption[];
  // 精算対象月（'YYYY-MM'）。作成 record の日付基準。
  yearMonth: string;
};

// ME / PARTNER / COUPLE のバケツ分け。
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

  const [step, setStep] = useState<Step>('ready');
  // record id → 割り当てたレート index（未割当は未登録）。
  const [rateByRecord, setRateByRecord] = useState<Map<number, number>>(
    new Map()
  );
  const [methodId, setMethodId] = useState<string>('');

  // 割当済みの record を RateAssignment 列にする（isMe = 自分の立替 = record.isSelf）。
  const assignments = useMemo<RateAssignment[]>(() => {
    const result: RateAssignment[] = [];
    for (const record of settleable) {
      const rateIndex = rateByRecord.get(record.id);
      if (rateIndex === undefined) {
        continue;
      }
      result.push({
        id: record.id,
        price: record.price,
        isMe: record.isSelf,
        rateIndex
      });
    }
    return result;
  }, [settleable, rateByRecord]);

  const reports = useMemo(() => summarizeByRate(assignments), [assignments]);
  const settlement = useMemo(
    () => resolveSettlement(assignments),
    [assignments]
  );
  const allAssigned = assignments.length === settleable.length;

  // result はトースト発火（useFormAction 内）が目的で参照はしないため破棄する。
  const [, createAction] = useFormAction(createSettlementRecordAction);
  const [, settleAction] = useFormAction(settleRecordsAction);

  const setRate = (recordId: number, rateIndex: number) => {
    setRateByRecord((prev) => {
      const next = new Map(prev);
      next.set(recordId, rateIndex);
      return next;
    });
  };

  const resetFlow = () => {
    setStep('ready');
    setRateByRecord(new Map());
    setMethodId('');
  };

  return (
    <div className='flex flex-col gap-6'>
      <RecordGroup title='自分の立替' records={me} />
      <RecordGroup title='相手の立替' records={partner} />
      <RecordGroup title='2人の記録' records={couple} />

      {!hasUnsettled ? (
        <p className='py-4 text-center text-muted-foreground text-sm'>
          未精算の立替はありません
        </p>
      ) : step === 'ready' ? (
        <ReadyStep count={settleable.length} onStart={() => setStep('going')} />
      ) : step === 'going' ? (
        <GoingStep
          settleable={settleable}
          rateByRecord={rateByRecord}
          reports={reports}
          settlement={settlement}
          allAssigned={allAssigned}
          onSetRate={setRate}
          onCancel={resetFlow}
          onConfirm={() => setStep('done')}
        />
      ) : (
        <DoneStep
          settlement={settlement}
          methods={methods}
          methodId={methodId}
          onMethodChange={setMethodId}
          assignedIds={collectAssignedIds(assignments)}
          settlementDate={`${yearMonth}-01`}
          createAction={createAction}
          settleAction={settleAction}
          onBack={() => setStep('going')}
        />
      )}
    </div>
  );
}

// READY: 未精算件数の確認とレート割当への遷移。
function ReadyStep({ count, onStart }: { count: number; onStart: () => void }) {
  return (
    <section className='flex flex-col gap-3 rounded-md border p-3'>
      <p className='text-sm'>未精算の立替が {count} 件あります。</p>
      <Button type='button' onClick={onStart}>
        精算をはじめる
      </Button>
    </section>
  );
}

// GOING: 立替ごとのレート割当 + 差額の自動算出。
function GoingStep({
  settleable,
  rateByRecord,
  reports,
  settlement,
  allAssigned,
  onSetRate,
  onCancel,
  onConfirm
}: {
  settleable: PairedRecordItem[];
  rateByRecord: Map<number, number>;
  reports: ReturnType<typeof summarizeByRate>;
  settlement: ReturnType<typeof resolveSettlement>;
  allAssigned: boolean;
  onSetRate: (recordId: number, rateIndex: number) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <section className='flex flex-col gap-4 rounded-md border p-3'>
      <div className='flex flex-col gap-2'>
        <h3 className='font-medium text-sm'>立替ごとに負担の割合を選ぶ</h3>
        <p className='text-muted-foreground text-xs'>
          「自分：相手」の割合。割り勘なら中央（5：5）を選びます。
        </p>
        <ul className='flex flex-col gap-2'>
          {settleable.map((record) => (
            <li
              key={record.id}
              className='flex items-center gap-2 rounded-md border p-2'
            >
              <span className='flex-1 truncate text-sm'>
                {record.isSelf ? '自分' : '相手'} / {record.typeName}
                {record.memo ? ` / ${record.memo}` : ''}
              </span>
              <span className='text-sm tabular-nums'>
                {toShowStr(record.price)} 円
              </span>
              <RateSelect
                value={rateByRecord.get(record.id)}
                onChange={(rateIndex) => onSetRate(record.id, rateIndex)}
              />
            </li>
          ))}
        </ul>
      </div>

      {reports.length > 0 ? <RateBreakdown reports={reports} /> : null}

      <SettlementSummary settlement={settlement} />

      <div className='flex items-center justify-between gap-2 border-t pt-3'>
        <Button type='button' variant='ghost' onClick={onCancel}>
          やめる
        </Button>
        <Button type='button' disabled={!allAssigned} onClick={onConfirm}>
          精算内容を確定
        </Button>
      </div>
      {!allAssigned ? (
        <p className='text-muted-foreground text-xs'>
          すべての立替に割合を設定すると次へ進めます。
        </p>
      ) : null}
    </section>
  );
}

// DONE: 算出済みの金額・方向で精算 record 作成 + 対象 record の精算済み化。
function DoneStep({
  settlement,
  methods,
  methodId,
  onMethodChange,
  assignedIds,
  settlementDate,
  createAction,
  settleAction,
  onBack
}: {
  settlement: ReturnType<typeof resolveSettlement>;
  methods: MethodOption[];
  methodId: string;
  onMethodChange: (value: string) => void;
  assignedIds: Id[];
  settlementDate: string;
  createAction: (payload: FormData) => void;
  settleAction: (payload: FormData) => void;
  onBack: () => void;
}) {
  return (
    <section className='flex flex-col gap-4 rounded-md border p-3'>
      <SettlementSummary settlement={settlement} />

      {settlement.needed ? (
        <div className='flex flex-col gap-3'>
          <h3 className='font-medium text-sm'>精算方法を選ぶ</h3>
          <Select
            value={methodId}
            onValueChange={(value) => onMethodChange(value ?? '')}
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
        </div>
      ) : (
        <p className='text-muted-foreground text-sm'>
          差額はありません。立替を精算済みにするだけで完了します。
        </p>
      )}

      <div className='flex flex-col gap-2 border-t pt-3'>
        {/* 精算 record 作成（差額があるときのみ）。金額・方向は算出値を hidden で送る。 */}
        {settlement.needed ? (
          <form action={createAction} className='flex flex-col gap-2'>
            <input type='hidden' name='date' value={settlementDate} readOnly />
            <input
              type='hidden'
              name='isPay'
              value={String(settlement.isPay)}
              readOnly
            />
            <input type='hidden' name='methodId' value={methodId} readOnly />
            <input
              type='hidden'
              name='price'
              value={String(settlement.price)}
              readOnly
            />
            <Button type='submit' disabled={methodId === ''}>
              精算 record を作成
            </Button>
          </form>
        ) : null}

        <form action={settleAction} className='flex flex-col gap-2'>
          {assignedIds.map((id) => (
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
            disabled={assignedIds.length === 0}
          >
            立替を精算済みにする
          </Button>
        </form>

        <Button type='button' variant='ghost' onClick={onBack}>
          割合を選び直す
        </Button>
      </div>
    </section>
  );
}

// 負担レートの選択（10:0〜0:10 の 11 段階。色は自分負担が多いほど赤系）。
function RateSelect({
  value,
  onChange
}: {
  value: number | undefined;
  onChange: (rateIndex: number) => void;
}) {
  return (
    <Select
      value={value === undefined ? '' : String(value)}
      onValueChange={(v) => onChange(Number(v))}
    >
      <SelectTrigger className='w-28'>
        <SelectValue placeholder='割合' />
      </SelectTrigger>
      <SelectContent>
        {RATE_LABEL_LIST.map((label, index) => (
          <SelectItem key={label} value={String(index)}>
            <span className='flex items-center gap-2'>
              <span
                aria-hidden
                className='inline-block size-3 rounded-full'
                style={{ backgroundColor: RATE_COLOR_LIST[index] }}
              />
              {label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// レート別の集計（合計 / 現状 / あるべき）。
function RateBreakdown({
  reports
}: {
  reports: ReturnType<typeof summarizeByRate>;
}) {
  return (
    <div className='flex flex-col gap-1 rounded-md bg-muted/40 p-2 text-xs'>
      <span className='font-medium'>内訳</span>
      {reports.map((r) => (
        <div key={r.rateIndex} className='flex items-center gap-2'>
          <span
            aria-hidden
            className='inline-block size-2.5 rounded-full'
            style={{ backgroundColor: RATE_COLOR_LIST[r.rateIndex] }}
          />
          <span className='w-16'>{RATE_LABEL_LIST[r.rateIndex]}</span>
          <span className='tabular-nums'>
            合計 {toShowStr(r.sum)} / 自分負担 {toShowStr(r.toBe)}（
            {Math.round(RATE_LIST[r.rateIndex] * 100)}%）
          </span>
        </div>
      ))}
    </div>
  );
}

// 差額の自動算出結果。
function SettlementSummary({
  settlement
}: {
  settlement: ReturnType<typeof resolveSettlement>;
}) {
  if (!settlement.needed) {
    return (
      <p className='rounded-md bg-muted/40 p-2 text-center text-sm'>
        差額なし（精算不要）
      </p>
    );
  }
  return (
    <p className='rounded-md bg-muted/40 p-2 text-center font-medium text-sm'>
      {toShowStr(settlement.price)} 円の
      {settlement.isPay ? 'お渡し' : '受け取り'}
    </p>
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
