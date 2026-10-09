'use client';

import { cn } from 'cn';
import { type ReactNode, useMemo, useState, useTransition } from 'react';
import {
  IconCheck,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconPencil,
  IconShare
} from '@/components/icons';
import { SectionListEmpty } from '@/components/section-list';
import { ThemeToggle } from '@/components/theme-toggle';
import { colorVar } from '@/features/master';
import {
  type PairedRecordItem,
  type PairUserNames,
  PlannedRecordMark
} from '@/features/record';
import { MethodPills } from '@/features/record/components/method-pills';
import { resolveMethodId } from '@/features/record/domain/method-order';
import { completeSettlementAction } from '@/features/record/settlement-actions';
import { fetchPairedRecordsAction } from '@/features/summary/actions';
import { shiftMonth } from '@/features/summary/domain/period';
import type { MethodCard } from '@/features/type-method';
import { lastDayOfMonthJst, toDateStringJst } from '@/lib/shared/domain/date';
import {
  amountToneClass,
  formatMonthDayWeekJa,
  formatPrice,
  formatSlashDateWeekJa,
  formatYearMonthJa
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
  insteadList,
  isOpenInstead,
  openSum,
  type RateGroup,
  type SettlementBuckets,
  settlementStatus,
  splitPairedRecords,
  toAssignments
} from '../domain/settlement-view';
import {
  insteadByName,
  settlementAssignedText,
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
// 分類の段は「左 = 立替、右 = 率」の 1 本の並びで、立替を複数選んでまとめて率を
// 割り当てられる。立替ごとにシートを開き直す往復をなくすのが狙いで、精算額と確定は
// 一覧の下に貼り付けて、率を選んだ結果がその場で見えるようにしている。
//
// ヘッダーに「個人｜共有」は無い（精算はペア固有で、モードに依らない）。

const labels = summaryLabels.settlement;

type Step = 'ready' | 'classify' | 'finish';

export function SettlementScreen({
  initialYearMonth,
  initialRecords,
  methods,
  userNames,
  headerLeft
}: {
  initialYearMonth: string;
  // 初期表示の月のペアの record（Server で取得済み）。
  initialRecords: PairedRecordItem[];
  // 精算方法の候補（方法マスタの「精算」）。
  methods: MethodCard[];
  // ペアの 2 人の名前。引けなければ null。
  userNames: PairUserNames | null;
  // ヘッダー左に置くもの（お知らせのベル）。
  headerLeft?: ReactNode;
}) {
  const [yearMonth, setYearMonth] = useState(initialYearMonth);
  const [records, setRecords] = useState(initialRecords);
  const [isPending, startTransition] = useTransition();

  const [step, setStep] = useState<Step>('ready');
  const [rates, setRates] = useState<ReadonlyMap<Id, number>>(new Map());
  // シートを開いている対象。空なら閉じている。1 件でも複数件でも同じシートを使う。
  const [sheetTargetIds, setSheetTargetIds] = useState<readonly Id[]>([]);
  // チェックを入れている立替。まとめて率を割り当てる対象。
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<Id>>(new Set());
  const [methodId, setMethodId] = useState<Id | null>(null);
  // 精算金額の入力。null は差額のまま（触っていない）。
  const [priceInput, setPriceInput] = useState<string | null>(null);
  const [isSubmitting, startSubmit] = useTransition();

  const resetFlow = () => {
    setStep('ready');
    setRates(new Map());
    setSheetTargetIds([]);
    setSelectedIds(new Set());
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
  const insteads = useMemo(() => insteadList(buckets), [buckets]);
  const { assignments, groups, totalDiff, direction, price } =
    useSettlementMath(insteads, rates, priceInput);

  const month = Number(yearMonth.split('-')[1]);
  const sheetRecords = insteads.filter((item) =>
    sheetTargetIds.includes(item.id)
  );
  // 名前が引けないときだけ「自分 / 相手」に落とす。
  const names: PairUserNames = {
    self: userNames?.self ?? labels.selfFallback,
    partner: userNames?.partner ?? labels.partnerFallback
  };
  // 既定はマスタの並びの先頭（入力画面と同じ決め方）。state は未選択のまま持ち、
  // 実際に使う id はここで解決する。
  const selectedMethodId = resolveMethodId({
    methods,
    selected: methodId,
    isEditing: false
  });

  // 対象ぜんぶに同じ率を入れる。選び終えたらシートも選択も畳み、次の 1 組へ進める。
  const assignRate = (rateIndex: number) => {
    setRates((prev) => {
      const next = new Map(prev);
      for (const id of sheetTargetIds) {
        next.set(id, rateIndex);
      }
      return next;
    });
    setSheetTargetIds([]);
    setSelectedIds(new Set());
  };

  const toggleSelected = (id: Id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) {
        next.add(id);
      }
      return next;
    });
  };

  const submit = () => {
    startSubmit(async () => {
      const result = await completeSettlementAction({
        yearMonth,
        ids: collectAssignedIds(assignments),
        isPay: direction.isPay,
        // 記録を作らない（0 円）ときは方法を送らない。
        methodId: price > 0 ? selectedMethodId : null,
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
    <div className='flex flex-col gap-3 px-3'>
      <div className='flex h-11 items-center justify-between'>
        <span>{headerLeft}</span>
        <ThemeToggle />
      </div>

      <h1 className='font-bold text-2xl'>{summaryLabels.heading.summary}</h1>

      <SummaryTabs current='settlement' hasPair />

      <div className='flex items-center gap-1'>
        <MonthNavButton
          direction='prev'
          isPending={isPending}
          onClick={() => load(shiftMonth(yearMonth, -1))}
        />
        <span className='font-semibold text-base'>
          {formatYearMonthJa(yearMonth)}
        </span>
        <MonthNavButton
          direction='next'
          isPending={isPending}
          onClick={() => load(shiftMonth(yearMonth, 1))}
        />
        {userNames === null ? null : (
          <span className='ml-auto flex h-6 items-center gap-1 rounded-xl bg-secondary px-2.5 font-bold text-primary text-xs'>
            <IconShare
              aria-hidden='true'
              className='size-3'
              strokeWidth={2.4}
            />
            {settlementBadge(userNames.partner)}
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
                methodId={selectedMethodId}
                methods={methods}
                names={names}
                onBack={() => {
                  setMethodId(null);
                  setStep('classify');
                }}
                onChangeMethod={setMethodId}
                onChangePrice={setPriceInput}
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

        {step === 'classify' ? (
          <ClassifySection
            insteads={insteads}
            names={names}
            onAssignOne={(id) => setSheetTargetIds([id])}
            onCancel={resetFlow}
            onConfirm={() => {
              setMethodId(null);
              setPriceInput(null);
              setStep('finish');
            }}
            onOpenBulk={() => setSheetTargetIds([...selectedIds])}
            onSelectAll={(ids) => setSelectedIds(new Set(ids))}
            onToggle={toggleSelected}
            rates={rates}
            selectedIds={selectedIds}
            totalDiff={totalDiff}
          />
        ) : (
          <>
            <InsteadSection insteads={insteads} names={names} rates={rates} />
            {/* 分類中は出さない。精算の対象外なので、率を割り当てる間は邪魔になる
                （貼り付いた精算額の下に潜り込んでしまう）。 */}
            <CoupleSection items={buckets.couple} names={names} />
          </>
        )}
      </div>

      {sheetRecords.length === 0 ? null : (
        <RateSheet
          names={names}
          onOpenChange={(open) => !open && setSheetTargetIds([])}
          onSelect={assignRate}
          rateIndex={sharedRateIndex(sheetRecords, rates)}
          records={sheetRecords}
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
  const nameById = useMemo(
    () => new Map(insteads.map((item) => [item.id, categoryName(item)])),
    [insteads]
  );
  const groups = useMemo(
    () => buildRateGroups(assignments, nameById),
    [assignments, nameById]
  );
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
  names,
  priceInput,
  price,
  yearMonth,
  isSubmitting,
  onStart,
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
  names: PairUserNames;
  priceInput: string;
  price: number;
  yearMonth: string;
  isSubmitting: boolean;
  onStart: () => void;
  onBack: () => void;
  onChangeMethod: (methodId: Id) => void;
  onChangePrice: (value: string) => void;
  onSubmit: () => void;
}) {
  if (step === 'ready') {
    return <ReadyPanel buckets={buckets} names={names} onStart={onStart} />;
  }
  if (step === 'classify') {
    return <ClassifyPanel groups={groups} />;
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
  names,
  onStart
}: {
  buckets: SettlementBuckets;
  names: PairUserNames;
  onStart: () => void;
}) {
  return (
    <div className='flex flex-col gap-3'>
      <span className='text-[13px] text-muted-foreground leading-relaxed'>
        {labels.ready.lead}
      </span>
      <div className='grid grid-cols-2 gap-2'>
        <SumTile
          label={insteadByName(names.self)}
          value={openSum(buckets.mine)}
        />
        <SumTile
          label={insteadByName(names.partner)}
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

// ② 分類。率ごとのグループ。件数が増えるとチップで画面が埋まるので、既定では畳む。
function ClassifyPanel({ groups }: { groups: RateGroup[] }) {
  if (groups.length === 0) {
    return (
      <div className='rounded-xl bg-background px-3 py-3.5 text-center text-[13px] text-muted-foreground leading-relaxed'>
        {labels.classify.hint}
      </div>
    );
  }

  const assigned = groups.reduce(
    (count, group) => count + group.chips.length,
    0
  );

  return (
    <div className='flex flex-col gap-1'>
      <span className='px-0.5 font-semibold text-[13px] text-muted-foreground'>
        {settlementAssignedText(assigned)}
      </span>
      <ul aria-label={labels.classify.groupsLabel} className='flex flex-col'>
        {groups.map((group) => (
          <RateGroupRow group={group} key={group.rateIndex} />
        ))}
      </ul>
    </div>
  );
}

// 率のグループ 1 つ。閉じているときは率・件数・差額だけ。開くと中身の立替と集計を出す。
function RateGroupRow({ group }: { group: RateGroup }) {
  const [isOpen, setIsOpen] = useState(false);
  const color = rateColor(group.rateIndex);

  return (
    <li className='border-line-soft border-b'>
      <button
        aria-expanded={isOpen}
        className='flex w-full items-center gap-2 py-2.5 text-left text-foreground'
        onClick={() => setIsOpen((prev) => !prev)}
        type='button'
      >
        <IconChevronDown
          aria-hidden='true'
          className={cn(
            'size-3.5 shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none',
            !isOpen && '-rotate-90'
          )}
          strokeWidth={2.6}
        />
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
      </button>

      {isOpen ? (
        <div className='flex flex-col gap-1.5 pb-2.5 pl-[22px]'>
          <div className='flex flex-wrap gap-1'>
            {group.chips.map((chip) => (
              <span
                className={cn(
                  'flex h-6 items-center gap-1.5 rounded-xl border px-2 text-xs',
                  chip.isMe
                    ? 'border-dash bg-card'
                    : 'border-transparent bg-muted'
                )}
                key={chip.id}
              >
                <span className='max-w-28 truncate'>{chip.name}</span>
                <span className='font-semibold'>
                  {chip.price.toLocaleString('ja-JP')}
                </span>
              </span>
            ))}
          </div>
          <span className='text-muted-foreground text-xs'>
            {labels.classify.sum} {group.sum.toLocaleString('ja-JP')} ·{' '}
            {labels.classify.asIs} {group.asIs.toLocaleString('ja-JP')} ·{' '}
            {labels.classify.toBe} {group.toBe.toLocaleString('ja-JP')}
          </span>
        </div>
      ) : null}
    </li>
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
  // 方法は既定で先頭が入るため、未選択になるのはマスタに精算方法が 1 件も無いときだけ。
  const needsMethod = price > 0 && methodId === null;
  const needsPrice = price === 0 && totalDiff !== 0;
  const canFinish = !needsMethod && !needsPrice;
  const disabledLabel = needsMethod
    ? labels.finish.needMethod
    : labels.finish.needPrice;
  const monthEnd = lastDayOfMonthJst(`${yearMonth}-01`);

  return (
    <div className='flex flex-col gap-3'>
      {/* 読むだけの行は地のまま、選ぶ・直す行は白い面に載せる。「白い面 = 触れる」は
          この app の入力欄（TextField）と同じ合図で、ここだけ地と逆になっていた。 */}
      <div className='flex flex-col gap-2.5 rounded-xl bg-background p-3'>
        <div className='flex items-center gap-2'>
          <span className='w-[72px] shrink-0 text-[13px] text-muted-foreground'>
            {labels.finish.result}
          </span>
          <span className={cn('font-bold text-base', diffColor(totalDiff))}>
            {totalDiff === 0
              ? settlementResultNoun(totalDiff)
              : `${Math.abs(totalDiff).toLocaleString('ja-JP')}円の${settlementResultNoun(totalDiff)}`}
          </span>
        </div>

        <div className='flex flex-col gap-1.5'>
          <span className='text-[13px] text-muted-foreground'>
            {labels.finish.method}
          </span>
          {methods.length === 0 ? (
            // 精算方法はペア共有の方法マスタにしか無いので、入力画面より案内を具体的にする。
            <span className='text-muted-foreground text-sm'>
              {labels.finish.noMethod}
            </span>
          ) : (
            // 入力画面と同じピル。選び方を画面ごとに変えない。
            <MethodPills
              methodId={methodId}
              methods={methods}
              onChange={onChangeMethod}
            />
          )}
        </div>

        <PriceField onChange={onChangePrice} value={priceInput} />
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

// 精算金額の入力。既定は差額だが直せる。鉛筆と白い面で触れることを示す
// （白い面 = 入力欄はこの app 共通の合図。TextField と同じ）。
function PriceField({
  value,
  onChange
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className='flex items-center gap-2'>
      <span className='w-[72px] shrink-0 text-[13px] text-muted-foreground'>
        {labels.finish.price}
      </span>
      <span className='flex h-12 min-w-0 flex-grow items-center gap-1.5 rounded-xl bg-card px-3 focus-within:outline-2 focus-within:outline-primary focus-within:outline-offset-2'>
        <IconPencil
          aria-hidden='true'
          className='size-3.5 shrink-0 text-muted-foreground'
          strokeWidth={2.4}
        />
        <input
          aria-label={labels.finish.price}
          className='min-w-0 flex-grow bg-transparent text-right font-bold text-[22px] text-foreground outline-none'
          inputMode='numeric'
          onChange={(event) => onChange(event.target.value)}
          type='text'
          value={value}
        />
        <span className='shrink-0 text-muted-foreground text-sm'>円</span>
      </span>
    </label>
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
  names
}: {
  items: PairedRecordItem[];
  names: PairUserNames;
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
              names={names}
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
  names
}: {
  item: PairedRecordItem;
  isFirst: boolean;
  names: PairUserNames;
}) {
  const color = colorVar(item.typeColorClassificationName);
  const sub = [
    formatSlashDateWeekJa(toDateStringJst(item.datetime)),
    // 精算 record は user_id が負担する側なので、isSelf が「自分から」を表す。
    item.isSettlement ? settlementTransferText(item.isSelf, names) : null
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
          <PlannedRecordMark isPlannedRecord={item.isPlannedRecord} />
        </span>
        <span className='truncate text-muted-foreground text-xs'>{sub}</span>
      </span>
      {/* 方法は日付・送金先と混ざらないよう金額の下に置く。 */}
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

// 分類中の立替の一覧と、精算額・確定。
function ClassifySection({
  insteads,
  names,
  rates,
  selectedIds,
  totalDiff,
  onToggle,
  onSelectAll,
  onOpenBulk,
  onAssignOne,
  onCancel,
  onConfirm
}: {
  insteads: PairedRecordItem[];
  names: PairUserNames;
  rates: ReadonlyMap<Id, number>;
  selectedIds: ReadonlySet<Id>;
  totalDiff: number;
  onToggle: (id: Id) => void;
  onSelectAll: (ids: Id[]) => void;
  onOpenBulk: () => void;
  onAssignOne: (id: Id) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const open = insteads.filter(isOpenInstead);
  const unassigned = open.filter((item) => !rates.has(item.id));
  const hasGroups = open.some((item) => rates.has(item.id));
  const selectedCount = selectedIds.size;
  // 未割当がまだあるなら、まずそれを選ぶのが次の手。無ければ全件を選び直せるようにする。
  const selectAllTargets = unassigned.length > 0 ? unassigned : open;
  const isAllSelected =
    selectAllTargets.length > 0 &&
    selectAllTargets.every((item) => selectedIds.has(item.id));

  return (
    <section className='flex flex-col gap-1.5'>
      <div className='flex items-center gap-2 px-1'>
        <h2 className='font-semibold text-[13px] text-muted-foreground'>
          {labels.list.heading}
        </h2>
        {unassigned.length > 0 ? (
          <span className='text-muted-foreground text-xs'>
            {labels.list.unassigned} {unassigned.length}件
          </span>
        ) : null}
        {open.length === 0 ? null : (
          <button
            className='ml-auto font-semibold text-primary text-xs'
            onClick={() =>
              onSelectAll(
                isAllSelected ? [] : selectAllTargets.map((item) => item.id)
              )
            }
            type='button'
          >
            {isAllSelected ? labels.list.clearSelection : labels.list.selectAll}
          </button>
        )}
      </div>

      <InsteadList
        insteads={insteads}
        isSelectable
        names={names}
        onAssignOne={onAssignOne}
        onToggle={onToggle}
        rates={rates}
        selectedIds={selectedIds}
      />

      <span className='px-1 text-muted-foreground text-xs leading-relaxed'>
        {labels.classify.note}
      </span>

      {/* 下に留め置いた精算額のぶん、一覧の末尾に場所を空ける（最後の行が隠れないように）。
          まとめ選びのバーが出ている間はその高さ 56 を足す。 */}
      <div
        aria-hidden='true'
        className={cn(
          'shrink-0',
          selectedCount === 0 ? 'h-[116px]' : 'h-[172px]'
        )}
      />

      {/* fixed をシェル幅（max-w-md）に収めるのはタブバーと同じ作り。
          bottom はバーの下端余白 + 高さ 56 + 間 8。 */}
      <div
        className='fixed inset-x-0 z-30 mx-auto flex w-full max-w-md flex-col gap-2 px-3'
        style={{
          bottom: 'calc(max(12px, env(safe-area-inset-bottom)) + 64px)'
        }}
      >
        {selectedCount === 0 ? null : (
          <button
            className='flex h-12 items-center justify-center gap-2 rounded-xl bg-primary font-bold text-base text-primary-foreground shadow-[0_6px_20px_rgba(22,25,26,0.18)]'
            onClick={onOpenBulk}
            type='button'
          >
            <span className='flex h-6 min-w-6 items-center justify-center rounded-xl bg-primary-foreground/20 px-1.5 font-bold text-xs'>
              {selectedCount}
            </span>
            {labels.list.bulkAssign}
          </button>
        )}

        <div className='flex flex-col gap-2 rounded-2xl bg-card p-3 shadow-[0_6px_20px_rgba(22,25,26,0.10)]'>
          <div className='flex items-baseline gap-1.5 rounded-xl bg-secondary px-3 py-2.5'>
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
          <div className='flex gap-2'>
            <SecondaryButton
              label={labels.classify.cancel}
              onClick={onCancel}
            />
            <PrimaryButton
              disabled={!hasGroups}
              disabledLabel={labels.classify.confirmDisabled}
              label={labels.classify.confirm}
              onClick={onConfirm}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

// 分類していないときの立替の一覧。操作は持たない。
function InsteadSection({
  insteads,
  names,
  rates
}: {
  insteads: PairedRecordItem[];
  names: PairUserNames;
  rates: ReadonlyMap<Id, number>;
}) {
  return (
    <section className='flex flex-col gap-1.5'>
      <div className='flex items-baseline px-1'>
        <h2 className='font-semibold text-[13px] text-muted-foreground'>
          {labels.list.heading}
        </h2>
        <span className='ml-auto text-muted-foreground text-xs'>
          {openSum(insteads).toLocaleString('ja-JP')}
        </span>
      </div>
      <InsteadList
        insteads={insteads}
        isSelectable={false}
        names={names}
        rates={rates}
      />
    </section>
  );
}

function InsteadList({
  insteads,
  names,
  rates,
  selectedIds,
  isSelectable,
  onToggle,
  onAssignOne
}: {
  insteads: PairedRecordItem[];
  names: PairUserNames;
  rates: ReadonlyMap<Id, number>;
  selectedIds?: ReadonlySet<Id>;
  isSelectable: boolean;
  onToggle?: (id: Id) => void;
  onAssignOne?: (id: Id) => void;
}) {
  if (insteads.length === 0) {
    return (
      <p className='rounded-2xl bg-card px-3 py-4 text-center text-muted-foreground text-xs'>
        {labels.list.empty}
      </p>
    );
  }

  return (
    <ul className='overflow-hidden rounded-2xl bg-card'>
      {insteads.map((item, index) => (
        <InsteadRow
          isFirst={index === 0}
          isSelectable={isSelectable}
          isSelected={selectedIds?.has(item.id) ?? false}
          item={item}
          key={item.id}
          names={names}
          onAssignOne={onAssignOne}
          onToggle={onToggle}
          rateIndex={rates.get(item.id)}
        />
      ))}
    </ul>
  );
}

// 立替 1 件の行。分類中は左半分がまとめ選びのチェック、右半分が 1 件だけの率選び。
function InsteadRow({
  item,
  names,
  rateIndex,
  isSelected,
  isSelectable,
  isFirst,
  onToggle,
  onAssignOne
}: {
  item: PairedRecordItem;
  names: PairUserNames;
  rateIndex: number | undefined;
  isSelected: boolean;
  isSelectable: boolean;
  isFirst: boolean;
  onToggle?: (id: Id) => void;
  onAssignOne?: (id: Id) => void;
}) {
  const isOpen = isOpenInstead(item);
  const isAssigned = rateIndex !== undefined && isOpen;
  const canPick = isSelectable && isOpen;
  const date = formatSlashDateWeekJa(toDateStringJst(item.datetime));
  const owner = item.isSelf ? names.self : names.partner;
  const sub = [date, owner, item.memo]
    .filter((part) => part !== null && part !== '')
    .join(' · ');

  return (
    // 区切り線は行そのものに引く。左右で別の要素に引くと、線のぶんだけ中身の起点が
    // ずれて率が行の中心から外れる。
    <li
      className={cn(
        'relative flex items-stretch',
        !isFirst && 'border-border border-t',
        !isOpen && 'opacity-60',
        isSelected && 'bg-secondary'
      )}
    >
      {/* 割当済みは率の色の帯で示す（行の地を塗ると選択中の色と混ざるため）。 */}
      <span
        aria-hidden='true'
        className='absolute inset-y-0 left-0 w-[4px]'
        style={{
          backgroundColor: isAssigned ? rateColor(rateIndex) : 'transparent'
        }}
      />

      <button
        aria-label={insteadAriaLabel({ item, date, owner, rateIndex })}
        aria-pressed={canPick ? isSelected : undefined}
        className='flex min-w-0 flex-grow items-center gap-2.5 py-2.5 pl-3 text-left text-foreground'
        disabled={!canPick}
        onClick={() => onToggle?.(item.id)}
        type='button'
      >
        {isSelectable ? (
          <CheckBox isChecked={isSelected} isDisabled={!isOpen} />
        ) : null}
        <span className='flex min-w-0 flex-grow flex-col gap-0.5'>
          <span className='flex items-center gap-1.5 text-[15px]'>
            <span
              aria-hidden='true'
              className='size-2 shrink-0 rounded-full'
              style={{
                backgroundColor: colorVar(item.typeColorClassificationName)
              }}
            />
            <span className='truncate'>{categoryName(item)}</span>
            <PlannedRecordMark
              isPlannedRecord={item.isPlannedRecord}
              size={13}
            />
            <span className='ml-auto shrink-0 font-bold text-base'>
              {item.price.toLocaleString('ja-JP')}
            </span>
          </span>
          <span className='truncate text-muted-foreground text-xs'>{sub}</span>
        </span>
      </button>

      <RateCell
        canPick={canPick}
        isSettled={!isOpen}
        onPick={() => onAssignOne?.(item.id)}
        rateIndex={rateIndex}
      />
    </li>
  );
}

// 行の右側。押すとこの 1 件だけの率選びに入る（左半分のまとめ選びと押し分ける）。
function RateCell({
  rateIndex,
  canPick,
  isSettled,
  onPick
}: {
  rateIndex: number | undefined;
  canPick: boolean;
  isSettled: boolean;
  onPick: () => void;
}) {
  const body = isSettled ? (
    <span className='flex items-center gap-0.5 font-bold text-primary text-xs'>
      <IconCheck aria-hidden='true' className='size-3' strokeWidth={3} />
      {labels.settled}
    </span>
  ) : rateIndex === undefined ? (
    <span
      className={cn(
        'flex h-7 items-center rounded-xl px-2.5 text-xs',
        canPick
          ? 'bg-muted font-semibold text-foreground'
          : 'text-muted-foreground'
      )}
    >
      {labels.list.rateUnset}
    </span>
  ) : (
    <span
      className='flex h-7 items-center gap-1.5 rounded-xl px-2.5 font-bold text-xs'
      style={{
        backgroundColor: rateTint(rateIndex),
        color: rateColor(rateIndex)
      }}
    >
      <span
        aria-hidden='true'
        className='size-2 rounded-full'
        style={{ backgroundColor: rateColor(rateIndex) }}
      />
      {RATE_LABEL_LIST[rateIndex]}
    </span>
  );

  // 率はカテゴリ・金額の行に並べる（行全体で中央寄せにすると、下のメモの行のぶん
  // カテゴリより下にずれて見える）。h-6 は text-[15px] の 1 行の高さ。
  const inner = (
    <span className='flex w-[108px] shrink-0 items-start justify-end pt-2.5 pr-3.5'>
      <span className='flex h-6 items-center'>{body}</span>
    </span>
  );

  if (!canPick) {
    return inner;
  }
  return (
    <button
      aria-label={labels.rateSheet.pick}
      className='flex items-start text-foreground'
      onClick={onPick}
      type='button'
    >
      {inner}
    </button>
  );
}

// チェックボックス。実体はボタンの中の飾りなので、input は置かず見た目だけ描く。
function CheckBox({
  isChecked,
  isDisabled
}: {
  isChecked: boolean;
  isDisabled: boolean;
}) {
  return (
    <span
      aria-hidden='true'
      className={cn(
        'flex size-5 shrink-0 items-center justify-center rounded-md border-2',
        isDisabled && 'opacity-40',
        isChecked
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-muted-foreground/40'
      )}
    >
      {isChecked ? (
        <IconCheck aria-hidden='true' className='size-3' strokeWidth={3.2} />
      ) : null}
    </span>
  );
}

// 読み上げ: 日付・カテゴリ・金額・誰の立替か。割当済みなら率も添える。
function insteadAriaLabel({
  item,
  date,
  owner,
  rateIndex
}: {
  item: PairedRecordItem;
  date: string;
  owner: string;
  rateIndex: number | undefined;
}): string {
  const amount = item.price.toLocaleString('ja-JP');
  return [
    `${date} ${categoryName(item)} ${amount}円（${owner}）`,
    rateIndex === undefined ? null : `精算率 ${RATE_LABEL_LIST[rateIndex]}`
  ]
    .filter((part) => part !== null)
    .join(' ');
}

// 対象が揃って同じ率なら、その率をシートで選択中として示す。揃っていなければ示さない。
function sharedRateIndex(
  records: PairedRecordItem[],
  rates: ReadonlyMap<Id, number>
): number | undefined {
  const first = rates.get(records[0]?.id ?? (0 as Id));
  if (first === undefined) {
    return undefined;
  }
  return records.every((record) => rates.get(record.id) === first)
    ? first
    : undefined;
}
