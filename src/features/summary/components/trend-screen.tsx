'use client';

import { cn } from 'cn';
import {
  type ReactNode,
  useMemo,
  useRef,
  useState,
  useTransition
} from 'react';
import { IconChevronLeft, IconChevronRight } from '@/components/icons';
import { PairModeSegment } from '@/components/pair-mode-segment';
import { StackedBarChart } from '@/components/stacked-bar-chart';
import { ThemeToggle } from '@/components/theme-toggle';
import { Segment } from '@/components/ui/segment';
import { useHorizontalSwipe } from '@/components/use-horizontal-swipe';
import { colorVar } from '@/features/master';
import {
  fetchPayIncomeAction,
  fetchSubTypeAction,
  fetchTypePeriodAction
} from '@/features/summary/actions';
import type {
  PayIncomeShowData,
  StackShowData
} from '@/features/summary/domain/chart-data';
import { shiftYear, yearLabel } from '@/features/summary/domain/period';
import type { TypeChip } from '@/features/summary/types';
import type { ChartBar, ChartBars } from '@/lib/shared/domain/bar-chart';
import { NO_SUB_TYPE_NAME } from '../domain/breakdown';
import {
  buildLegend,
  buildSignedBars,
  buildStackedBars,
  buildTrendTable,
  isSignedView,
  type TrendLegendRow,
  type TrendView,
  trendTargetName,
  trendYearTotal
} from '../domain/trend';
import { summaryLabels, trendHeadLabel } from '../labels';
import { SummaryTabs } from './summary-tabs';

// 集計 › 推移（原典 SumTrend）。年単位で 12 か月の棒を出し、月をタップして選ぶ。
//
// 2 つの見方を持つ:
// - 全体: 収支（0 線をまたぐ）か支出のみ。下に月別テーブルが付き、行を押しても月を選べる。
// - カテゴリ別: カテゴリの積み上げ。チップでカテゴリを 1 つ選ぶとサブカテゴリ別に変わる。
//
// 「個人｜共有」の切替はページが再描画されて初期データが変わる。この画面の state は
// ページ側の key で作り直す。

// 全体の棒の色。正の収支はアクセント、負は削除色（デザイン基礎の収入／支出と同じ）。
const POSITIVE_COLOR = 'var(--primary)';
const NEGATIVE_COLOR = 'var(--destructive)';

// カテゴリを絞らない（チップの「全て」）。
const ALL_TYPES = null;

type Query = {
  year: number;
  isAll: boolean;
  isBalance: boolean;
  isPay: boolean;
  isIncludeInstead: boolean;
  typeId: number | null;
};

async function fetchTrend(
  query: Query,
  isPair: boolean
): Promise<
  | { kind: 'all'; data: PayIncomeShowData }
  | { kind: 'stack'; data: StackShowData }
> {
  if (query.isAll) {
    const data = await fetchPayIncomeAction({
      year: query.year,
      isPair,
      isIncludeInstead: query.isIncludeInstead
    });
    return { kind: 'all', data };
  }
  const data =
    query.typeId === ALL_TYPES
      ? await fetchTypePeriodAction({
          year: query.year,
          isPay: query.isPay,
          isPair
        })
      : await fetchSubTypeAction({ year: query.year, typeId: query.typeId });
  return { kind: 'stack', data };
}

export function TrendScreen({
  hasPair,
  isPair,
  initialYear,
  initialMonth,
  initialData,
  chips,
  headerLeft
}: {
  hasPair: boolean;
  isPair: boolean;
  initialYear: number;
  // 最初に選んでおく月（今年なら今月）。
  initialMonth: number;
  // 初期表示（全体・収支）の集計（Server で取得済み）。
  initialData: PayIncomeShowData;
  // カテゴリ別のチップ。支出／収入で出るカテゴリが違う。
  chips: { pay: TypeChip[]; income: TypeChip[] };
  // ヘッダー左に置くもの（お知らせのベル）。
  headerLeft?: ReactNode;
}) {
  const [year, setYear] = useState(initialYear);
  // 全体か、カテゴリ別か。
  const [isAll, setIsAll] = useState(true);
  // 全体のピル: 収支か、支出のみか。
  const [isBalance, setIsBalance] = useState(true);
  // カテゴリ別のピル: 支出か、収入か。
  const [isPay, setIsPay] = useState(true);
  // 共有モードは立替を区別しないので、この state は個人モードでのみ効く。
  const [isIncludeInstead, setIsIncludeInstead] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  // 全体の集計と、カテゴリ別の積み上げ。見方を切り替えた先の分だけ取り直す。
  const [payIncome, setPayIncome] = useState(initialData);
  const [stack, setStack] = useState<StackShowData | null>(null);
  // 絞り込んでいるカテゴリ（null は「全て」= カテゴリ別の積み上げ）。
  const [typeId, setTypeId] = useState<number | null>(ALL_TYPES);
  const [isPending, startTransition] = useTransition();

  // いま出ている見方の取得条件。どれか 1 つでも変わったら取り直す。
  const current: Query = {
    year,
    isAll,
    isBalance,
    isPay,
    isIncludeInstead,
    typeId
  };

  // 最後に要求した条件。連続操作で応答の順序が入れ替わっても古い年へ巻き戻らないよう、
  // これと別物の応答は捨てる。
  const latest = useRef<Query | null>(null);

  // 取得中も前の内容を出したままにし、画面が空白になるのを避ける（内訳と同じ）。
  const load = (next: Query, nextMonth = selectedMonth) => {
    latest.current = next;
    setYear(next.year);
    setIsAll(next.isAll);
    setIsBalance(next.isBalance);
    setIsPay(next.isPay);
    setIsIncludeInstead(next.isIncludeInstead);
    setTypeId(next.typeId);
    setSelectedMonth(nextMonth);
    startTransition(async () => {
      const result = await fetchTrend(next, isPair);
      if (latest.current !== next) {
        return;
      }
      if (result.kind === 'all') {
        setPayIncome(result.data);
      } else {
        setStack(result.data);
      }
    });
  };

  // 移った先では移動方向に近い端の月を選ぶ（前の年なら 12 月、次の年なら 1 月）。
  const moveYear = (delta: number) =>
    load({ ...current, year: shiftYear(year, delta) }, delta < 0 ? 12 : 1);

  const swipe = useHorizontalSwipe({
    onSwipeLeft: () => moveYear(1),
    onSwipeRight: () => moveYear(-1)
  });

  const currentChips = isPay ? chips.pay : chips.income;
  const view = toView({ isAll, isBalance, isPay, typeId, chips: currentChips });
  const target = trendTargetName(view, summaryLabels.trend);

  const table = useMemo(() => buildTrendTable(payIncome), [payIncome]);
  const chart = useMemo(
    () => buildChart({ isAll, isBalance, payIncome, stack }),
    [isAll, isBalance, payIncome, stack]
  );
  const legend = useMemo(
    () =>
      isAll || stack === null
        ? []
        : buildLegend(stack.rows, stack.series, selectedMonth),
    [isAll, stack, selectedMonth]
  );

  // 選択中の月の値。棒と同じ数字を右上に出す。
  const selectedValue = chart.bars[selectedMonth - 1]?.value ?? 0;
  const yearTotal = trendYearTotal(view, table, chart.bars);
  const showValue = (value: number) =>
    isSignedView(view) ? signedAmount(value) : value.toLocaleString('ja-JP');
  const toAriaLabel = (bar: ChartBar) =>
    `${bar.label} ${target} ${showValue(bar.value)}円`;

  return (
    <div className='flex flex-col gap-3 px-3' {...swipe}>
      <div className='flex h-11 items-center justify-between'>
        <span>{headerLeft}</span>
        <div className='flex items-center gap-1.5'>
          <ThemeToggle />
          <PairModeSegment hasPair={hasPair} isPair={isPair} />
        </div>
      </div>

      <h1 className='font-bold text-2xl'>{summaryLabels.heading.summary}</h1>

      <SummaryTabs current='trend' hasPair={hasPair} />

      <div className='flex items-center gap-1'>
        <YearNavButton
          direction='prev'
          isPending={isPending}
          onClick={() => moveYear(-1)}
        />
        <span className='font-semibold text-base'>{yearLabel(year)}</span>
        <YearNavButton
          direction='next'
          isPending={isPending}
          onClick={() => moveYear(1)}
        />
        {/* 全体は「収支｜支出のみ」、カテゴリ別は「支出｜収入」。 */}
        <TrendPills
          isFirstSelected={isAll ? isBalance : isPay}
          label={isAll ? PILL_LABEL.all : PILL_LABEL.byType}
          onSelectFirst={() =>
            load(
              isAll
                ? { ...current, isBalance: true }
                : // カテゴリ別で支出収入を変えるとカテゴリの顔ぶれが変わるので、
                  // 絞り込みは「全て」に戻す（原典どおり）。
                  { ...current, isPay: true, typeId: ALL_TYPES }
            )
          }
          onSelectSecond={() =>
            load(
              isAll
                ? { ...current, isBalance: false }
                : { ...current, isPay: false, typeId: ALL_TYPES }
            )
          }
        />
      </div>

      <KindRow
        isAll={isAll}
        isIncludeInstead={isIncludeInstead}
        onChangeInstead={(next) => load({ ...current, isIncludeInstead: next })}
        onChangeKind={(next) => load({ ...current, isAll: next })}
        // 立替の扱いは全体の金額にだけ効く（カテゴリ別の集計は立替を分けない）。
        // 共有モードとペア未設定で出さないのは内訳と同じ（D6）。
        showInstead={isAll && !isPair && hasPair}
      />

      {isAll ? null : (
        <TypeChips
          chips={currentChips}
          onSelect={(nextTypeId) => load({ ...current, typeId: nextTypeId })}
          typeId={typeId}
        />
      )}

      <div
        aria-busy={isPending}
        className={cn('flex flex-col gap-3', isPending && 'opacity-60')}
      >
        <TrendChartCard
          bars={chart.bars}
          legend={legend}
          onSelectMonth={setSelectedMonth}
          selectedMonth={selectedMonth}
          selectedValue={selectedValue}
          showValue={showValue}
          target={target}
          toAriaLabel={toAriaLabel}
          year={year}
          yearTotal={yearTotal}
          zeroTop={chart.zeroTop}
        />

        {isAll ? (
          <TrendTable
            onSelect={setSelectedMonth}
            selectedMonth={selectedMonth}
            table={table}
          />
        ) : null}
      </div>
    </div>
  );
}

// いまの操作の組み合わせから「何を見ているか」を決める。
function toView({
  isAll,
  isBalance,
  isPay,
  typeId,
  chips
}: {
  isAll: boolean;
  isBalance: boolean;
  isPay: boolean;
  typeId: number | null;
  chips: TypeChip[];
}): TrendView {
  if (isAll) {
    return isBalance ? { kind: 'balance' } : { kind: 'pay' };
  }
  // カテゴリを絞っていれば、その名前が見出しの対象になる。
  const selected =
    typeId === ALL_TYPES
      ? undefined
      : chips.find((chip) => chip.typeId === typeId);
  return {
    kind: 'byType',
    targetName:
      selected?.name ??
      (isPay ? summaryLabels.trend.pay : summaryLabels.trend.income)
  };
}

// 全体は 12 か月の値を 1 本ずつ、カテゴリ別は系列を積み上げて棒にする。
// カテゴリ別はまだ取れていない（切り替えた直後）ことがあるので、そのときは空で描く。
function buildChart({
  isAll,
  isBalance,
  payIncome,
  stack
}: {
  isAll: boolean;
  isBalance: boolean;
  payIncome: PayIncomeShowData;
  stack: StackShowData | null;
}): ChartBars {
  if (isAll) {
    const values = payIncome.rows.map((row) =>
      isBalance ? row.payAndIncome : row.pay
    );
    return buildSignedBars(values, POSITIVE_COLOR, NEGATIVE_COLOR);
  }
  if (stack === null) {
    return { bars: [], zeroTop: 0 };
  }
  return buildStackedBars(stack.rows, stack.series, colorVar);
}

// 収支は「黒字か赤字か」で、他画面の「支出か収入か」とは別の軸。色（balanceColor）だけでは
// どちらに振れたか読み取れないので、この画面に限り符号を添える（+130,000 / −45,000）。
function signedAmount(value: number): string {
  const abs = Math.abs(value).toLocaleString('ja-JP');
  if (value === 0) {
    return abs;
  }
  return `${value < 0 ? '−' : '+'}${abs}`;
}

function YearNavButton({
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
      aria-label={direction === 'prev' ? '前の年' : '次の年'}
      className='flex size-9 items-center justify-center rounded-full text-foreground disabled:opacity-50'
      disabled={isPending}
      onClick={onClick}
      type='button'
    >
      <Icon aria-hidden='true' className='size-4.5' strokeWidth={2.4} />
    </button>
  );
}

// 年ナビ右のピル 2 枚。見方によって選択肢が変わる（内訳の支出／収入と同じ形）。
const PILL_LABEL = {
  all: {
    group: '収支か支出か',
    first: summaryLabels.trend.balance,
    second: summaryLabels.trend.payOnly
  },
  byType: {
    group: '支出か収入か',
    first: summaryLabels.trend.pay,
    second: summaryLabels.trend.income
  }
} as const;

function TrendPills({
  label,
  isFirstSelected,
  onSelectFirst,
  onSelectSecond
}: {
  label: { group: string; first: string; second: string };
  isFirstSelected: boolean;
  onSelectFirst: () => void;
  onSelectSecond: () => void;
}) {
  return (
    <fieldset aria-label={label.group} className='ml-auto flex gap-1.5'>
      <TrendPill
        isSelected={isFirstSelected}
        label={label.first}
        onSelect={onSelectFirst}
      />
      <TrendPill
        isSelected={!isFirstSelected}
        label={label.second}
        onSelect={onSelectSecond}
      />
    </fieldset>
  );
}

function TrendPill({
  label,
  isSelected,
  onSelect
}: {
  label: string;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      aria-pressed={isSelected}
      className={cn(
        'h-[30px] rounded-full px-3 text-[13px]',
        isSelected
          ? 'bg-foreground font-semibold text-background'
          : 'bg-card text-foreground'
      )}
      onClick={onSelect}
      type='button'
    >
      {label}
    </button>
  );
}

// 見方（全体｜カテゴリ別）と立替の扱いのセグメント。
function KindRow({
  isAll,
  isIncludeInstead,
  showInstead,
  onChangeKind,
  onChangeInstead
}: {
  isAll: boolean;
  isIncludeInstead: boolean;
  showInstead: boolean;
  onChangeKind: (isAll: boolean) => void;
  onChangeInstead: (isIncludeInstead: boolean) => void;
}) {
  return (
    <div className='flex items-center gap-2'>
      <Segment
        fit
        label={summaryLabels.trend.kindLabel}
        onChange={(value) => onChangeKind(value === 'all')}
        options={[
          { value: 'all', label: summaryLabels.trend.all },
          { value: 'byType', label: summaryLabels.trend.byType }
        ]}
        size='sm'
        value={isAll ? 'all' : 'byType'}
      />
      {showInstead ? (
        <Segment
          className='ml-auto'
          fit
          label={summaryLabels.instead.label}
          onChange={(value) => onChangeInstead(value === 'include')}
          options={[
            { value: 'include', label: summaryLabels.instead.include },
            { value: 'onlyMe', label: summaryLabels.instead.onlyMe }
          ]}
          size='sm'
          value={isIncludeInstead ? 'include' : 'onlyMe'}
        />
      ) : null}
    </div>
  );
}

// カテゴリのチップ（カテゴリ別のみ）。先頭の「全て」は絞り込みを外す。
function TypeChips({
  chips,
  typeId,
  onSelect
}: {
  chips: TypeChip[];
  typeId: number | null;
  onSelect: (typeId: number | null) => void;
}) {
  return (
    <fieldset
      aria-label={summaryLabels.trend.chipsLabel}
      className='-mx-3 flex gap-1.5 overflow-x-auto px-3'
      data-swipe-ignore
    >
      <TypeChipButton
        isSelected={typeId === ALL_TYPES}
        label={summaryLabels.trend.allTypes}
        onSelect={() => onSelect(ALL_TYPES)}
      />
      {chips.map((chip) => (
        <TypeChipButton
          colorName={chip.colorName}
          isSelected={typeId === chip.typeId}
          key={chip.typeId}
          label={chip.name}
          onSelect={() => onSelect(chip.typeId)}
        />
      ))}
    </fieldset>
  );
}

// チップ 1 枚。選択中は本文色の地に白文字（ドットも白）。
function TypeChipButton({
  label,
  colorName,
  isSelected,
  onSelect
}: {
  label: string;
  // 「全て」は色を持たない。
  colorName?: string;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      aria-pressed={isSelected}
      className={cn(
        'flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-2xl px-3 text-[13px]',
        isSelected
          ? 'bg-foreground font-semibold text-background'
          : 'bg-card text-foreground'
      )}
      onClick={onSelect}
      type='button'
    >
      {colorName === undefined ? null : (
        <span
          aria-hidden='true'
          className='size-2 rounded-full'
          style={{
            backgroundColor: isSelected
              ? 'var(--background)'
              : colorVar(colorName)
          }}
        />
      )}
      {label}
    </button>
  );
}

// 月別テーブル（全体のみ）。行を押すとその月を選ぶ（グラフと連動）。
function TrendTable({
  table,
  selectedMonth,
  onSelect
}: {
  table: ReturnType<typeof buildTrendTable>;
  selectedMonth: number;
  onSelect: (month: number) => void;
}) {
  const gridClass = 'grid grid-cols-[44px_repeat(3,minmax(0,1fr))] px-3.5';
  return (
    <div className='overflow-hidden rounded-2xl bg-card'>
      <div
        className={cn(
          gridClass,
          'h-9 items-center border-border border-b font-semibold text-muted-foreground text-xs'
        )}
      >
        <span>{summaryLabels.trend.table.month}</span>
        <span className='text-right'>{summaryLabels.trend.table.pay}</span>
        <span className='text-right'>{summaryLabels.trend.table.income}</span>
        <span className='text-right'>{summaryLabels.trend.table.balance}</span>
      </div>

      {table.rows.map((row) => (
        <button
          aria-pressed={row.month === selectedMonth}
          className={cn(
            gridClass,
            'h-9 w-full items-center text-left text-foreground text-sm',
            row.month !== 1 && 'border-line-soft border-t',
            row.month === selectedMonth && 'bg-background'
          )}
          key={row.month}
          onClick={() => onSelect(row.month)}
          type='button'
        >
          <span className='text-muted-foreground'>{row.month}月</span>
          <span
            className={cn(
              'text-right',
              row.isEmpty ? 'text-icon-muted' : 'text-foreground'
            )}
          >
            {row.pay.toLocaleString('ja-JP')}
          </span>
          <span
            className={cn(
              'text-right',
              row.isEmpty ? 'text-icon-muted' : 'text-foreground'
            )}
          >
            {row.income.toLocaleString('ja-JP')}
          </span>
          <span
            className={cn(
              'text-right font-semibold',
              balanceColor(row.balance)
            )}
          >
            {signedAmount(row.balance)}
          </span>
        </button>
      ))}

      <div
        className={cn(
          gridClass,
          'h-10 items-center border-border border-t bg-background font-bold text-sm'
        )}
      >
        <span className='text-muted-foreground text-xs'>
          {summaryLabels.trend.table.total}
        </span>
        <span className='text-right'>
          {table.sumPay.toLocaleString('ja-JP')}
        </span>
        <span className='text-right'>
          {table.sumIncome.toLocaleString('ja-JP')}
        </span>
        <span className={cn('text-right', balanceColor(table.sumBalance))}>
          {signedAmount(table.sumBalance)}
        </span>
      </div>
    </div>
  );
}

// 収支の色。0 は数字を落とし、黒字はアクセント、赤字は削除色。
function balanceColor(balance: number): string {
  if (balance === 0) {
    return 'text-icon-muted';
  }
  return balance > 0 ? 'text-primary' : 'text-destructive';
}

// グラフのカード（見出し・棒・凡例）。全体もカテゴリ別も同じ枠で、
// 凡例はカテゴリ別のときだけ中に出る。
function TrendChartCard({
  year,
  target,
  yearTotal,
  selectedMonth,
  selectedValue,
  showValue,
  bars,
  zeroTop,
  legend,
  onSelectMonth,
  toAriaLabel
}: {
  year: number;
  // 「収支」「支出」「食費」など、いま見ているものの呼び名。
  target: string;
  yearTotal: number;
  selectedMonth: number;
  selectedValue: number;
  showValue: (value: number) => string;
  bars: ChartBar[];
  zeroTop: number;
  legend: TrendLegendRow[];
  onSelectMonth: (month: number) => void;
  toAriaLabel: (bar: ChartBar) => string;
}) {
  const selectedKey = String(selectedMonth);
  return (
    <div className='flex flex-col gap-3 rounded-2xl bg-card px-4 pt-4 pb-3'>
      <div className='flex items-end gap-2'>
        <div className='flex flex-col gap-0.5'>
          <span className='text-[13px] text-muted-foreground'>
            {trendHeadLabel(yearLabel(year), target)}
          </span>
          <span className='flex items-baseline gap-1'>
            <span
              className={cn(
                'font-bold text-[26px]',
                yearTotal < 0 ? 'text-destructive' : 'text-foreground'
              )}
            >
              {showValue(yearTotal)}
            </span>
            <span className='font-semibold text-sm'>円</span>
          </span>
        </div>
        <div className='ml-auto flex flex-col items-end gap-0.5'>
          <span className='text-muted-foreground text-xs'>
            {trendHeadLabel(`${selectedMonth}月`, target)}
          </span>
          <span
            className={cn(
              'font-semibold text-[15px]',
              selectedValue < 0 ? 'text-destructive' : 'text-foreground'
            )}
          >
            {showValue(selectedValue)}円
          </span>
        </div>
      </div>

      <StackedBarChart
        bars={bars}
        onSelect={(key) => onSelectMonth(Number(key))}
        selectedKey={selectedKey}
        toAriaLabel={toAriaLabel}
        zeroTop={zeroTop}
      />

      {legend.length === 0 ? null : (
        <div className='flex flex-col border-line-soft border-t pt-2.5'>
          {legend.map((row) => (
            <div className='flex h-8 items-center gap-2.5' key={row.key}>
              <span
                aria-hidden='true'
                className='size-2.5 shrink-0 rounded-[3px]'
                style={{ backgroundColor: colorVar(row.colorName) }}
              />
              <span
                className={cn(
                  'flex-grow text-sm',
                  // 「サブカテゴリなし」は実体のある分類ではないので文字を落とす。
                  row.name === NO_SUB_TYPE_NAME
                    ? 'text-muted-foreground'
                    : 'text-foreground'
                )}
              >
                {row.name}
              </span>
              <span className='text-muted-foreground text-xs'>
                {row.selected.toLocaleString('ja-JP')}
              </span>
              <span className='w-[88px] text-right font-semibold text-sm'>
                {row.total.toLocaleString('ja-JP')}
              </span>
            </div>
          ))}
          <div className='flex justify-end gap-2.5 pt-0.5 text-[11px] text-muted-foreground'>
            <span>{selectedMonth}月</span>
            <span className='w-[88px] text-right'>
              {summaryLabels.trend.yearTotal}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
