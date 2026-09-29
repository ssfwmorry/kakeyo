'use client';

import { cn } from 'cn';
import { type ReactNode, useMemo, useState, useTransition } from 'react';
import {
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconShare,
  IconUpdate
} from '@/components/icons';
import { SectionListEmpty } from '@/components/section-list';
import { ThemeToggle } from '@/components/theme-toggle';
import { colorVar } from '@/features/master';
import type { PairedRecordItem } from '@/features/record';
import { completeSettlementAction } from '@/features/record/settlement-actions';
import { fetchPairedRecordsAction } from '@/features/summary/actions';
import { monthLabel, shiftMonth } from '@/features/summary/domain/period';
import type { MethodCard } from '@/features/type-method';
import { lastDayOfMonthJst, toDateStringJst } from '@/lib/shared/domain/date';
import {
  amountToneClass,
  formatMonthDayWeekJa,
  formatPrice,
  formatSlashDateWeekJa
} from '@/lib/shared/domain/format';
import { parsePrice } from '@/lib/shared/domain/price';
import { showToast } from '@/lib/shared/toast/show-toast';
import type { Id } from '@/lib/shared/types/id';
import {
  collectAssignedIds,
  resolveSettlement,
  totalSettlementDiff
} from '../domain/settlement';
import {
  RATE_LABEL_LIST,
  rateColor,
  rateTint
} from '../domain/settlement-rate';
import {
  buildRateGroups,
  isOpenInstead,
  openSum,
  type RateGroup,
  type SettlementBuckets,
  settlementStatus,
  splitPairedRecords,
  toAssignments
} from '../domain/settlement-view';
import {
  settlementBadge,
  settlementDiffText,
  settlementDoneTitle,
  settlementFinishNote,
  settlementResultNoun,
  settlementResultVerb,
  settlementTransferText,
  summaryLabels
} from '../labels';
import { RateSheet } from './rate-sheet';
import { categoryName } from './settlement-text';
import { SummaryTabs } from './summary-tabs';

// 集計 › 精算（原典 SumSettle）。ペアがいるときだけ開く。
//
// 月の立替に精算率を割り当てて精算額を出し、精算 record を作って立替を精算済みにする。
// 3 ステップ（準備 → 分類 → 精算）の state をこの画面が 1 つで持ち、率の割当は
// record id → 率の index の Map で持つ。月を動かすと途中の分類は捨てる。
//
// ヘッダーに「個人｜共有」は無い（精算はペア固有で、モードに依らない）。

const labels = summaryLabels.settlement;

type Step = 'ready' | 'classify' | 'finish';

export function SettlementScreen({
  initialYearMonth,
  initialRecords,
  methods,
  partnerName,
  headerLeft
}: {
  initialYearMonth: string;
  // 初期表示の月のペアの record（Server で取得済み）。
  initialRecords: PairedRecordItem[];
  // 精算方法の候補（方法マスタの「精算」）。
  methods: MethodCard[];
  // ペアの相手の名前。引けなければ null。
  partnerName: string | null;
  // ヘッダー左に置くもの（お知らせのベル）。
  headerLeft?: ReactNode;
}) {
  const [yearMonth, setYearMonth] = useState(initialYearMonth);
  const [records, setRecords] = useState(initialRecords);
  const [isPending, startTransition] = useTransition();

  const [step, setStep] = useState<Step>('ready');
  const [rates, setRates] = useState<ReadonlyMap<Id, number>>(new Map());
  const [sheetRecordId, setSheetRecordId] = useState<Id | null>(null);
  const [methodId, setMethodId] = useState<Id | null>(null);
  // 精算金額の入力。null は差額のまま（触っていない）。
  const [priceInput, setPriceInput] = useState<string | null>(null);
  const [isSubmitting, startSubmit] = useTransition();

  const resetFlow = () => {
    setStep('ready');
    setRates(new Map());
    setSheetRecordId(null);
    setMethodId(null);
    setPriceInput(null);
  };

  // 取得中も前の内容を出したままにし、画面が空白になるのを避ける（内訳と同じ）。
  const load = (nextYearMonth: string) => {
    setYearMonth(nextYearMonth);
    resetFlow();
    startTransition(async () => {
      setRecords(await fetchPairedRecordsAction({ yearMonth: nextYearMonth }));
    });
  };

  const buckets = useMemo(() => splitPairedRecords(records), [records]);
  const status = settlementStatus(buckets);
  const insteads = useMemo(
    () => [...buckets.mine, ...buckets.partner],
    [buckets]
  );
  const { assignments, groups, totalDiff, direction, price } =
    useSettlementMath(insteads, rates, priceInput);

  const month = Number(yearMonth.split('-')[1]);
  const sheetRecord =
    insteads.find((item) => item.id === sheetRecordId) ?? null;

  const assignRate = (id: Id, rateIndex: number) => {
    setRates((prev) => new Map(prev).set(id, rateIndex));
    setSheetRecordId(null);
  };

  const submit = () => {
    startSubmit(async () => {
      const result = await completeSettlementAction({
        yearMonth,
        ids: collectAssignedIds(assignments),
        isPay: direction.isPay,
        // 記録を作らない（0 円）ときは方法を送らない。
        methodId: price > 0 ? methodId : null,
        price
      });
      if (result.toast !== undefined) {
        showToast(result.toast);
      }
      if (result.toast?.type === 'success') {
        resetFlow();
        setRecords(await fetchPairedRecordsAction({ yearMonth }));
      }
    });
  };

  return (
    <div className='flex flex-col gap-3 px-4'>
      <div className='flex h-11 items-center justify-between'>
        <span>{headerLeft}</span>
        <ThemeToggle />
      </div>

      <h1 className='font-bold text-3xl'>{summaryLabels.heading.summary}</h1>

      <SummaryTabs current='settlement' hasPair />

      <div className='flex items-center gap-1'>
        <MonthNavButton
          direction='prev'
          isPending={isPending}
          onClick={() => load(shiftMonth(yearMonth, -1))}
        />
        <span className='font-semibold text-base'>{monthLabel(yearMonth)}</span>
        <MonthNavButton
          direction='next'
          isPending={isPending}
          onClick={() => load(shiftMonth(yearMonth, 1))}
        />
        {partnerName === null ? null : (
          <span className='ml-auto flex h-6 items-center gap-1 rounded-xl bg-secondary px-2.5 font-bold text-primary text-xs'>
            <IconShare
              aria-hidden='true'
              className='size-3'
              strokeWidth={2.4}
            />
            {settlementBadge(partnerName)}
          </span>
        )}
      </div>

      <div
        aria-busy={isPending}
        className={cn('flex flex-col gap-3', isPending && 'opacity-60')}
      >
        <div className='flex flex-col gap-3.5 rounded-2xl bg-card px-3.5 pt-3.5 pb-4'>
          {status === 'open' ? (
            <>
              <Stepper step={step} />
              <FlowPanel
                buckets={buckets}
                groups={groups}
                isSubmitting={isSubmitting}
                methodId={methodId}
                methods={methods}
                onBack={() => {
                  setMethodId(null);
                  setStep('classify');
                }}
                onCancel={resetFlow}
                onChangeMethod={setMethodId}
                onChangePrice={setPriceInput}
                onConfirm={() => {
                  setMethodId(null);
                  setPriceInput(null);
                  setStep('finish');
                }}
                onStart={() => setStep('classify')}
                onSubmit={submit}
                price={price}
                priceInput={priceInput ?? String(direction.price)}
                step={step}
                totalDiff={totalDiff}
                yearMonth={yearMonth}
              />
            </>
          ) : (
            <DonePanel hasInstead={status === 'settled'} month={month} />
          )}
        </div>

        <CoupleSection
          items={buckets.couple}
          partner={partnerName ?? labels.partnerFallback}
        />

        <div className='mt-1 grid grid-cols-2 gap-2'>
          <InsteadColumn
            isClassifying={step === 'classify'}
            items={buckets.mine}
            onOpen={setSheetRecordId}
            rates={rates}
            title={labels.columns.mine}
          />
          <InsteadColumn
            isClassifying={step === 'classify'}
            items={buckets.partner}
            onOpen={setSheetRecordId}
            rates={rates}
            title={labels.columns.partner}
          />
        </div>
      </div>

      {sheetRecord === null ? null : (
        <RateSheet
          onOpenChange={(open) => !open && setSheetRecordId(null)}
          onSelect={(rateIndex) => assignRate(sheetRecord.id, rateIndex)}
          rateIndex={rates.get(sheetRecord.id)}
          record={sheetRecord}
        />
      )}
    </div>
  );
}

function MonthNavButton({
  direction,
  isPending,
  onClick
}: {
  direction: 'prev' | 'next';
  isPending: boolean;
  onClick: () => void;
}) {
  const Icon = direction === 'prev' ? IconChevronLeft : IconChevronRight;
  return (
    <button
      aria-label={direction === 'prev' ? '前の月' : '次の月'}
      className='flex size-9 items-center justify-center rounded-full text-foreground disabled:opacity-50'
      disabled={isPending}
      onClick={onClick}
      type='button'
    >
      <Icon aria-hidden='true' className='size-4.5' strokeWidth={2.4} />
    </button>
  );
}

// 率の割当から按分・差額・精算金額を出す。画面の state を計算に写すだけで、副作用は持たない。
function useSettlementMath(
  insteads: PairedRecordItem[],
  rates: ReadonlyMap<Id, number>,
  priceInput: string | null
) {
  const assignments = useMemo(
    () => toAssignments(insteads, rates),
    [insteads, rates]
  );
  const groups = useMemo(() => buildRateGroups(assignments), [assignments]);
  const totalDiff = totalSettlementDiff(groups);
  const direction = resolveSettlement(assignments);

  // 精算金額。触っていなければ差額、触っていれば入力値（読めなければ 0）。
  const price = useMemo(() => {
    if (priceInput === null) {
      return direction.price;
    }
    const parsed = parsePrice(priceInput);
    return parsed.ok ? parsed.value : 0;
  }, [priceInput, direction.price]);

  return { assignments, groups, totalDiff, direction, price };
}

// いまの段の中身。準備 → 分類 → 精算。
function FlowPanel({
  step,
  buckets,
  groups,
  totalDiff,
  methods,
  methodId,
  priceInput,
  price,
  yearMonth,
  isSubmitting,
  onStart,
  onCancel,
  onConfirm,
  onBack,
  onChangeMethod,
  onChangePrice,
  onSubmit
}: {
  step: Step;
  buckets: SettlementBuckets;
  groups: RateGroup[];
  totalDiff: number;
  methods: MethodCard[];
  methodId: Id | null;
  priceInput: string;
  price: number;
  yearMonth: string;
  isSubmitting: boolean;
  onStart: () => void;
  onCancel: () => void;
  onConfirm: () => void;
  onBack: () => void;
  onChangeMethod: (methodId: Id) => void;
  onChangePrice: (value: string) => void;
  onSubmit: () => void;
}) {
  if (step === 'ready') {
    return <ReadyPanel buckets={buckets} onStart={onStart} />;
  }
  if (step === 'classify') {
    return (
      <ClassifyPanel
        groups={groups}
        onCancel={onCancel}
        onConfirm={onConfirm}
        totalDiff={totalDiff}
      />
    );
  }
  return (
    <FinishPanel
      isSubmitting={isSubmitting}
      methodId={methodId}
      methods={methods}
      onBack={onBack}
      onChangeMethod={onChangeMethod}
      onChangePrice={onChangePrice}
      onSubmit={onSubmit}
      price={price}
      priceInput={priceInput}
      totalDiff={totalDiff}
      yearMonth={yearMonth}
    />
  );
}

// 3 段のステッパー。済んだ段はチェック、いまの段は太字。段の間を線で結ぶ。
function Stepper({ step }: { step: Step }) {
  const current = (['ready', 'classify', 'finish'] as const).indexOf(step);
  return (
    <ol aria-label={labels.stepsLabel} className='flex items-start'>
      {labels.steps.map((label, index) => (
        <StepItem
          index={index}
          isCurrent={index === current}
          isDone={index < current}
          key={label}
          label={label}
        />
      ))}
    </ol>
  );
}

function StepItem({
  index,
  label,
  isDone,
  isCurrent
}: {
  index: number;
  label: string;
  isDone: boolean;
  isCurrent: boolean;
}) {
  const isReached = isDone || isCurrent;
  return (
    <li
      aria-current={isCurrent ? 'step' : undefined}
      className='relative flex flex-grow basis-0 flex-col items-center gap-1'
    >
      {index === 0 ? null : (
        <span
          aria-hidden='true'
          className={cn(
            'absolute top-3 right-[calc(50%+17px)] h-0.5 w-[calc(100%-34px)]',
            isReached ? 'bg-primary' : 'bg-muted'
          )}
        />
      )}
      <span
        className={cn(
          'flex size-[26px] items-center justify-center rounded-full font-bold text-[13px]',
          isReached
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground'
        )}
      >
        {isDone ? (
          <IconCheck
            aria-hidden='true'
            className='size-[13px]'
            strokeWidth={3}
          />
        ) : (
          index + 1
        )}
      </span>
      <span
        className={cn(
          'text-xs',
          isCurrent ? 'font-bold text-foreground' : 'text-muted-foreground'
        )}
      >
        {label}
      </span>
    </li>
  );
}

// ① 準備。未精算の立替の合計を自分・相手で示し、分類を始める。
function ReadyPanel({
  buckets,
  onStart
}: {
  buckets: SettlementBuckets;
  onStart: () => void;
}) {
  return (
    <div className='flex flex-col gap-3'>
      <span className='text-[13px] text-muted-foreground leading-relaxed'>
        {labels.ready.lead}
      </span>
      <div className='grid grid-cols-2 gap-2'>
        <SumTile label={labels.ready.mine} value={openSum(buckets.mine)} />
        <SumTile
          label={labels.ready.partner}
          value={openSum(buckets.partner)}
        />
      </div>
      <PrimaryButton label={labels.ready.start} onClick={onStart} />
    </div>
  );
}

function SumTile({ label, value }: { label: string; value: number }) {
  return (
    <div className='flex flex-col gap-0.5 rounded-xl bg-background px-3 py-2.5'>
      <span className='text-muted-foreground text-xs'>{label}</span>
      <span className='font-bold text-[17px]'>
        {value.toLocaleString('ja-JP')}円
      </span>
    </div>
  );
}

// ② 分類。率ごとのグループと精算額を出す。立替の行は画面下の 2 列で選ぶ。
function ClassifyPanel({
  groups,
  totalDiff,
  onCancel,
  onConfirm
}: {
  groups: RateGroup[];
  totalDiff: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const hasGroups = groups.length > 0;
  return (
    <div className='flex flex-col gap-3'>
      {hasGroups ? null : (
        <div className='rounded-xl bg-background px-3 py-3.5 text-center text-[13px] text-muted-foreground leading-relaxed'>
          {labels.classify.hint}
        </div>
      )}

      {groups.map((group) => (
        <RateGroupRow group={group} key={group.rateIndex} />
      ))}

      <span className='flex items-center gap-2.5 text-[11px] text-muted-foreground'>
        <span className='flex items-center gap-1'>
          <span
            aria-hidden='true'
            className='h-3 w-[18px] rounded-md border border-dash'
          />
          {labels.classify.legendMine}
        </span>
        <span className='flex items-center gap-1'>
          <span
            aria-hidden='true'
            className='h-3 w-[18px] rounded-md bg-muted'
          />
          {labels.classify.legendPartner}
        </span>
      </span>

      {hasGroups ? (
        <div className='flex items-baseline gap-1.5 rounded-xl bg-secondary p-3'>
          <span className='text-[13px] text-muted-foreground'>
            {labels.classify.result}
          </span>
          <span
            className={cn(
              'ml-auto font-bold text-[22px]',
              diffColor(totalDiff)
            )}
          >
            {Math.abs(totalDiff).toLocaleString('ja-JP')}
          </span>
          <span className={cn('font-semibold text-sm', diffColor(totalDiff))}>
            {settlementResultVerb(totalDiff)}
          </span>
        </div>
      ) : null}

      <div className='flex gap-2'>
        <SecondaryButton label={labels.classify.cancel} onClick={onCancel} />
        <PrimaryButton
          disabled={!hasGroups}
          disabledLabel={labels.classify.confirmDisabled}
          label={labels.classify.confirm}
          onClick={onConfirm}
        />
      </div>

      <span className='text-muted-foreground text-xs leading-relaxed'>
        {labels.classify.note}
      </span>
    </div>
  );
}

// 率のグループ 1 つ。バッジ・件数・差額と、金額のチップ、集計の 1 行。
function RateGroupRow({ group }: { group: RateGroup }) {
  const color = rateColor(group.rateIndex);
  return (
    <div className='flex flex-col gap-1.5 border-line-soft border-b pb-2.5'>
      <div className='flex items-center gap-2'>
        <span
          className='flex h-6 items-center gap-1.5 rounded-xl px-2.5 font-bold text-xs'
          style={{ backgroundColor: rateTint(group.rateIndex), color }}
        >
          <span
            aria-hidden='true'
            className='size-2 rounded-full'
            style={{ backgroundColor: color }}
          />
          {RATE_LABEL_LIST[group.rateIndex]}
        </span>
        <span className='text-muted-foreground text-xs'>
          {group.chips.length}件
        </span>
        <span
          className={cn(
            'ml-auto font-semibold text-[13px]',
            group.diff === 0 ? 'text-muted-foreground' : 'text-foreground'
          )}
        >
          {settlementDiffText(group.diff)}
        </span>
      </div>
      <div className='flex flex-wrap gap-1'>
        {group.chips.map((chip) => (
          <span
            className={cn(
              'flex h-6 items-center rounded-xl border px-2 text-xs',
              chip.isMe ? 'border-dash bg-card' : 'border-transparent bg-muted'
            )}
            key={chip.id}
          >
            {chip.price.toLocaleString('ja-JP')}
          </span>
        ))}
      </div>
      <span className='text-muted-foreground text-xs'>
        {labels.classify.sum} {group.sum.toLocaleString('ja-JP')} ·{' '}
        {labels.classify.asIs} {group.asIs.toLocaleString('ja-JP')} ·{' '}
        {labels.classify.toBe} {group.toBe.toLocaleString('ja-JP')}
      </span>
    </div>
  );
}

// ③ 精算。方法と金額を決めて完了する。
function FinishPanel({
  totalDiff,
  methods,
  methodId,
  priceInput,
  price,
  yearMonth,
  isSubmitting,
  onChangeMethod,
  onChangePrice,
  onBack,
  onSubmit
}: {
  totalDiff: number;
  methods: MethodCard[];
  methodId: Id | null;
  priceInput: string;
  price: number;
  yearMonth: string;
  isSubmitting: boolean;
  onChangeMethod: (methodId: Id) => void;
  onChangePrice: (value: string) => void;
  onBack: () => void;
  onSubmit: () => void;
}) {
  // 金額があるときは方法が要る。差額なし（0 円）は記録を作らないので方法は要らない。
  const needsMethod = price > 0 && methodId === null;
  const needsPrice = price === 0 && totalDiff !== 0;
  const canFinish = !needsMethod && !needsPrice;
  const disabledLabel = needsMethod
    ? labels.finish.needMethod
    : labels.finish.needPrice;
  const monthEnd = lastDayOfMonthJst(`${yearMonth}-01`);

  return (
    <div className='flex flex-col gap-3'>
      <div className='overflow-hidden rounded-xl bg-background'>
        <div className='flex h-12 items-center gap-2 px-3'>
          <span className='w-[72px] text-[13px] text-muted-foreground'>
            {labels.finish.result}
          </span>
          <span className={cn('font-bold text-base', diffColor(totalDiff))}>
            {totalDiff === 0
              ? settlementResultNoun(totalDiff)
              : `${Math.abs(totalDiff).toLocaleString('ja-JP')}円の${settlementResultNoun(totalDiff)}`}
          </span>
        </div>
        <div className='flex flex-col gap-2 border-border border-t px-3 pt-2.5 pb-3'>
          <span className='text-[13px] text-muted-foreground'>
            {labels.finish.method}
          </span>
          {methods.length === 0 ? (
            <span className='text-muted-foreground text-sm'>
              {labels.finish.noMethod}
            </span>
          ) : (
            <div className='flex flex-wrap gap-2'>
              {methods.map((method) => {
                const isSelected = method.id === methodId;
                return (
                  <button
                    aria-pressed={isSelected}
                    className={cn(
                      'h-9 rounded-full px-3.5 font-semibold text-sm',
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card text-foreground'
                    )}
                    key={method.id}
                    onClick={() => onChangeMethod(method.id)}
                    type='button'
                  >
                    {method.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <label className='flex h-13 items-center gap-2 border-border border-t px-3'>
          <span className='w-[72px] text-[13px] text-muted-foreground'>
            {labels.finish.price}
          </span>
          <input
            aria-label={labels.finish.price}
            className='h-10 min-w-0 flex-grow bg-transparent text-right font-bold text-foreground text-xl outline-none'
            inputMode='numeric'
            onChange={(event) => onChangePrice(event.target.value)}
            type='text'
            value={priceInput}
          />
          <span className='text-muted-foreground text-sm'>円</span>
        </label>
      </div>

      <div className='flex gap-2'>
        <SecondaryButton label={labels.finish.cancel} onClick={onBack} />
        <PrimaryButton
          disabled={!canFinish || isSubmitting}
          disabledLabel={canFinish ? labels.finish.complete : disabledLabel}
          label={labels.finish.complete}
          onClick={onSubmit}
        />
      </div>

      <span className='text-muted-foreground text-xs leading-relaxed'>
        {settlementFinishNote(
          formatMonthDayWeekJa(monthEnd).replace(/（.*）$/, '')
        )}
      </span>
    </div>
  );
}

// 精算が済んだ月・立替の無い月。
function DonePanel({
  month,
  hasInstead
}: {
  month: number;
  hasInstead: boolean;
}) {
  return (
    <div className='flex items-center gap-3 py-1'>
      <span className='flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary'>
        <IconCheck
          aria-hidden='true'
          className='size-5 text-primary'
          strokeWidth={2.6}
        />
      </span>
      <span className='flex flex-col gap-0.5'>
        <span className='font-semibold text-base'>
          {settlementDoneTitle(month, hasInstead)}
        </span>
        <span className='text-[13px] text-muted-foreground'>
          {hasInstead ? labels.done.sub : labels.none.sub}
        </span>
      </span>
    </div>
  );
}

// 渡すは削除色、受け取るはアクセント、差額なしは文字色。
function diffColor(diff: number): string {
  if (diff === 0) {
    return 'text-foreground';
  }
  return diff > 0 ? 'text-destructive' : 'text-primary';
}

function PrimaryButton({
  label,
  disabledLabel,
  disabled = false,
  onClick
}: {
  label: string;
  disabledLabel?: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        'h-12 flex-grow rounded-xl',
        disabled
          ? 'bg-disabled font-semibold text-muted-foreground text-sm'
          : 'bg-primary font-bold text-base text-primary-foreground'
      )}
      disabled={disabled}
      onClick={onClick}
      type='button'
    >
      {disabled && disabledLabel !== undefined ? disabledLabel : label}
    </button>
  );
}

function SecondaryButton({
  label,
  onClick
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className='h-12 w-[104px] shrink-0 rounded-xl bg-muted font-semibold text-[15px] text-foreground'
      onClick={onClick}
      type='button'
    >
      {label}
    </button>
  );
}

// 二人のお金（共有・精算）。精算の対象外なので一覧に出すだけ。
function CoupleSection({
  items,
  partner
}: {
  items: PairedRecordItem[];
  partner: string;
}) {
  return (
    <section className='flex flex-col gap-1.5'>
      <div className='mt-1 flex items-baseline px-1'>
        <h2 className='font-semibold text-[13px] text-muted-foreground'>
          {labels.couple.heading}
        </h2>
        <span className='ml-auto text-muted-foreground text-xs'>
          {labels.couple.note}
        </span>
      </div>
      <div className='overflow-hidden rounded-2xl bg-card'>
        {items.length === 0 ? (
          <SectionListEmpty>{labels.couple.empty}</SectionListEmpty>
        ) : (
          items.map((item, index) => (
            <CoupleRow
              isFirst={index === 0}
              item={item}
              key={item.id}
              partner={partner}
            />
          ))
        )}
      </div>
    </section>
  );
}

function CoupleRow({
  item,
  isFirst,
  partner
}: {
  item: PairedRecordItem;
  isFirst: boolean;
  partner: string;
}) {
  const color = colorVar(item.typeColorClassificationName);
  const sub = [
    formatSlashDateWeekJa(toDateStringJst(item.datetime)),
    // 精算 record は user_id が負担する側なので、isSelf が「自分から」を表す。
    item.isSettlement ? settlementTransferText(item.isSelf, partner) : null
  ]
    .filter((part) => part !== null)
    .join(' · ');
  return (
    <div className='flex h-14 items-center gap-3 px-3.5'>
      {/* 精算は実体のあるカテゴリではないので、塗らず輪郭だけで描く（内訳と同じ）。 */}
      <span
        aria-hidden='true'
        className='size-2.5 shrink-0 rounded-full'
        style={
          item.isSettlement
            ? { border: `2px solid ${color}` }
            : { backgroundColor: color }
        }
      />
      <span
        className={cn(
          'flex min-w-0 flex-grow flex-col justify-center gap-0.5 self-stretch',
          !isFirst && 'border-border border-t'
        )}
      >
        <span className='flex items-center gap-1.5 text-[15px]'>
          <span className='truncate'>{categoryName(item)}</span>
          {item.isPlannedRecord ? (
            <IconUpdate
              aria-label='定期の記録'
              className='size-[13px] shrink-0 text-muted-foreground'
              role='img'
              strokeWidth={2.2}
            />
          ) : null}
        </span>
        <span className='truncate text-muted-foreground text-xs'>{sub}</span>
      </span>
      {/* 方法は日付・送金先と混ざらないよう金額の下に置く（内訳の明細と同じ並び）。 */}
      <span className='flex shrink-0 flex-col items-end gap-0.5'>
        <span
          className={cn(
            'font-semibold text-base',
            // 精算は立替の受け渡しで支出・収入の別を持たないため、色を付けず本文色のまま。
            item.isSettlement ? null : amountToneClass(item.isPay ?? true)
          )}
        >
          {formatPrice(item.price)}
        </span>
        <span className='text-muted-foreground text-xs'>{item.methodName}</span>
      </span>
    </div>
  );
}

// 立替の列（自分／相手）。見出しに未精算の合計、下に record のカードを積む。
function InsteadColumn({
  title,
  items,
  rates,
  isClassifying,
  onOpen
}: {
  title: string;
  items: PairedRecordItem[];
  rates: ReadonlyMap<Id, number>;
  isClassifying: boolean;
  onOpen: (id: Id) => void;
}) {
  return (
    <div className='flex min-w-0 flex-col gap-1.5'>
      <div className='flex items-baseline px-1'>
        <h2 className='font-semibold text-[13px] text-muted-foreground'>
          {title}
        </h2>
        <span className='ml-auto text-muted-foreground text-xs'>
          {openSum(items).toLocaleString('ja-JP')}
        </span>
      </div>
      {items.length === 0 ? (
        <p className='rounded-xl bg-card px-3 py-3 text-center text-muted-foreground text-xs'>
          {labels.columns.empty}
        </p>
      ) : (
        items.map((item) => (
          <InsteadCard
            isClassifying={isClassifying}
            item={item}
            key={item.id}
            onOpen={() => onOpen(item.id)}
            rateIndex={rates.get(item.id)}
          />
        ))
      )}
    </div>
  );
}

// 立替 1 件のカード。分類中は押して率を選ぶ。割当済みは率の色で塗り、精算済みは薄くする。
function InsteadCard({
  item,
  rateIndex,
  isClassifying,
  onOpen
}: {
  item: PairedRecordItem;
  rateIndex: number | undefined;
  isClassifying: boolean;
  onOpen: () => void;
}) {
  const isOpen = isOpenInstead(item);
  const isAssigned = rateIndex !== undefined && isOpen;
  const isTappable = isClassifying && isOpen;
  const date = formatSlashDateWeekJa(toDateStringJst(item.datetime));
  const amount = item.price.toLocaleString('ja-JP');

  return (
    <button
      aria-label={insteadAriaLabel({
        item,
        date,
        amount,
        rateIndex,
        isTappable
      })}
      className={cn(
        'relative flex w-full flex-col gap-[3px] overflow-hidden rounded-xl py-2 pr-2.5 pl-3.5 text-left text-foreground',
        !isOpen && 'opacity-60'
      )}
      disabled={!isTappable}
      onClick={onOpen}
      style={{
        backgroundColor: isAssigned ? rateTint(rateIndex) : 'var(--card)'
      }}
      type='button'
    >
      <span
        aria-hidden='true'
        className='absolute inset-y-0 left-0 w-[5px]'
        style={{
          backgroundColor: isAssigned ? rateColor(rateIndex) : 'transparent'
        }}
      />
      <CardStatusLine
        date={date}
        isNew={isTappable && !isAssigned}
        isSettled={!isOpen}
      />
      <span className='flex w-full items-center gap-1.5 overflow-hidden whitespace-nowrap text-[13px]'>
        <span
          aria-hidden='true'
          className='size-2 shrink-0 rounded-full'
          style={{
            backgroundColor: colorVar(item.typeColorClassificationName)
          }}
        />
        <span className='truncate'>{categoryName(item)}</span>
      </span>
      <span className='flex w-full items-baseline gap-1'>
        {isAssigned ? (
          <span
            className='flex h-[18px] items-center self-center rounded-[9px] bg-card px-1.5 font-bold text-[10px]'
            style={{ color: rateColor(rateIndex) }}
          >
            {RATE_LABEL_LIST[rateIndex]}
          </span>
        ) : null}
        <span className='ml-auto font-bold text-base'>{amount}</span>
      </span>
      <span className='min-h-3.5 w-full truncate text-[11px] text-muted-foreground'>
        {item.memo ?? ''}
      </span>
    </button>
  );
}

// 読み上げ: 日付・カテゴリ・金額・誰の立替か。割当済みなら率、押せるなら操作を続ける。
function insteadAriaLabel({
  item,
  date,
  amount,
  rateIndex,
  isTappable
}: {
  item: PairedRecordItem;
  date: string;
  amount: string;
  rateIndex: number | undefined;
  isTappable: boolean;
}): string {
  const who = item.isSelf ? labels.columns.mine : labels.columns.partner;
  return [
    `${date} ${categoryName(item)} ${amount}円（${who}）`,
    rateIndex === undefined ? null : `精算率 ${RATE_LABEL_LIST[rateIndex]}`,
    isTappable ? labels.rateSheet.pick : null
  ]
    .filter((part) => part !== null)
    .join(' ');
}

// カードの 1 行目: 日付と、右端に「未割当の印（丸）」か「精算済み」。
function CardStatusLine({
  date,
  isNew,
  isSettled
}: {
  date: string;
  isNew: boolean;
  isSettled: boolean;
}) {
  return (
    <span className='flex w-full items-center gap-1 text-[11px] text-muted-foreground'>
      {date}
      {isNew ? (
        <span
          aria-hidden='true'
          className='ml-auto size-2 rounded-full bg-primary'
        />
      ) : null}
      {isSettled ? (
        <span className='ml-auto flex items-center gap-0.5 font-bold text-primary'>
          <IconCheck
            aria-hidden='true'
            className='size-[11px]'
            strokeWidth={3}
          />
          {labels.settled}
        </span>
      ) : null}
    </span>
  );
}
