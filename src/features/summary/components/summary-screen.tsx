'use client';

import { cn } from 'cn';
import Link from 'next/link';
import {
  type ReactNode,
  useMemo,
  useRef,
  useState,
  useTransition
} from 'react';
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconShare
} from '@/components/icons';
import { PairModeSegment } from '@/components/pair-mode-segment';
import { SectionListEmpty } from '@/components/section-list';
import { ThemeToggle } from '@/components/theme-toggle';
import { Segment } from '@/components/ui/segment';
import { useHorizontalSwipe } from '@/components/use-horizontal-swipe';
import { colorVar } from '@/features/master';
import { fetchPieAction } from '@/features/summary/actions';
import type { PieShowData } from '@/features/summary/domain/chart-data';
import { monthLabel, shiftMonth } from '@/features/summary/domain/period';
import {
  type BreakdownRow,
  type BreakdownSubRow,
  buildBreakdown,
  NO_SUB_TYPE_NAME
} from '../domain/breakdown';
import { breakdownFootnote, summaryLabels, totalLabel } from '../labels';
import { Donut } from './donut';
import { MonthPickerSheet } from './month-picker-sheet';
import { SummaryTabs } from './summary-tabs';

// 集計 › 内訳（原典 SumBreakdown）。カテゴリ／方法の軸、立替の扱い、サブカテゴリの
// 子行、年月ピッカーを持つ。推移・精算は別ルート。
//
// 「個人｜共有」の切替はページが再描画されて初期データが変わる。この画面の state は
// ページ側の key で作り直す。

// 明細への遷移先。いま見ている絞り込みをそのまま引き継ぐ。
// id / 年月は数字に効くのでサーバが検証し直す。名前と色は表示のためだけに渡す。
function recordsHref({
  isType,
  isPay,
  isIncludeInstead,
  yearMonth,
  row,
  subTypeId,
  subTypeName
}: {
  isType: boolean;
  isPay: boolean;
  isIncludeInstead: boolean;
  yearMonth: string;
  row: BreakdownRow;
  subTypeId: number | null;
  subTypeName: string | null;
}): string {
  const params = new URLSearchParams({
    axis: isType ? 'type' : 'method',
    id: String(row.id),
    name: row.name,
    color: row.colorName,
    isPay: isPay ? '1' : '0',
    instead: isIncludeInstead ? '1' : '0',
    ym: yearMonth
  });
  if (subTypeId !== null) {
    params.set('subTypeId', String(subTypeId));
    params.set('subTypeName', subTypeName ?? '');
  }
  return `/summary/records?${params.toString()}`;
}

// 軸（カテゴリ／方法）と支出収入の組で、ピルとドーナツ中央の呼び名が変わる。
function kindLabel(isType: boolean, isPay: boolean): string {
  if (isType) {
    return isPay ? summaryLabels.kind.pay : summaryLabels.kind.income;
  }
  return isPay
    ? summaryLabels.kind.payByMethod
    : summaryLabels.kind.receiveByMethod;
}

export function SummaryScreen({
  hasPair,
  isPair,
  initialYearMonth,
  initialData,
  headerLeft
}: {
  hasPair: boolean;
  isPair: boolean;
  initialYearMonth: string;
  // 初期表示の月・支出・カテゴリ軸の集計（Server で取得済み）。
  initialData: PieShowData;
  // ヘッダー左に置くもの（お知らせのベル）。
  headerLeft?: ReactNode;
}) {
  const [yearMonth, setYearMonth] = useState(initialYearMonth);
  const [isPay, setIsPay] = useState(true);
  const [isType, setIsType] = useState(true);
  // 共有モードは立替を区別しないので、この state は個人モードでのみ効く。
  const [isIncludeInstead, setIsIncludeInstead] = useState(true);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [data, setData] = useState(initialData);
  const [isPending, startTransition] = useTransition();

  type Query = {
    yearMonth: string;
    isPay: boolean;
    isType: boolean;
    isIncludeInstead: boolean;
  };

  // 最後に要求した条件。応答が返った時点でこれと別物なら、その応答は捨てる。
  // 月を連続で送ると応答の順序が入れ替わることがあり、無条件に入れると表示が
  // 前の月へ巻き戻る。
  const latest = useRef<Query | null>(null);

  // 取得中も前の内容を出したままにし、画面が空白になるのを避ける。
  const load = (next: Query) => {
    latest.current = next;
    setYearMonth(next.yearMonth);
    setIsPay(next.isPay);
    setIsType(next.isType);
    setIsIncludeInstead(next.isIncludeInstead);
    startTransition(async () => {
      const result = await fetchPieAction({
        isType: next.isType,
        isPay: next.isPay,
        isPair,
        isIncludeInstead: next.isIncludeInstead,
        yearMonth: next.yearMonth
      });
      if (latest.current === next) {
        setData(result);
      }
    });
  };

  const current: Query = { yearMonth, isPay, isType, isIncludeInstead };

  const moveMonth = (delta: number) =>
    load({ ...current, yearMonth: shiftMonth(yearMonth, delta) });

  const swipe = useHorizontalSwipe({
    onSwipeLeft: () => moveMonth(1),
    onSwipeRight: () => moveMonth(-1)
  });
  const breakdown = useMemo(() => buildBreakdown(data.list), [data.list]);
  const kind = kindLabel(isType, isPay);
  const footnote = breakdownFootnote(hasPair, isPair, isIncludeInstead, kind);

  return (
    <div className='flex flex-col gap-3 px-4' {...swipe}>
      <div className='flex h-11 items-center justify-between'>
        <span>{headerLeft}</span>
        <div className='flex items-center gap-1.5'>
          <ThemeToggle />
          <PairModeSegment hasPair={hasPair} isPair={isPair} />
        </div>
      </div>

      <h1 className='font-bold text-3xl'>{summaryLabels.heading.summary}</h1>

      <SummaryTabs current='breakdown' hasPair={hasPair} />

      <div className='flex items-center gap-1'>
        <MonthNavButton
          direction='prev'
          isPending={isPending}
          onClick={() => moveMonth(-1)}
        />
        <button
          aria-label='表示する月を選ぶ'
          className='flex h-9 items-center gap-1 rounded-lg px-1.5 font-semibold text-base text-foreground'
          onClick={() => setIsPickerOpen(true)}
          type='button'
        >
          {monthLabel(yearMonth)}
          <IconChevronDown
            aria-hidden='true'
            className='size-3.5 text-icon-muted'
            strokeWidth={2.4}
          />
        </button>
        <MonthNavButton
          direction='next'
          isPending={isPending}
          onClick={() => moveMonth(1)}
        />
        <fieldset aria-label='支出か収入か' className='ml-auto flex gap-1.5'>
          <PayPill
            isSelected={isPay}
            label={kindLabel(isType, true)}
            onSelect={() => load({ ...current, isPay: true })}
          />
          <PayPill
            isSelected={!isPay}
            label={kindLabel(isType, false)}
            onSelect={() => load({ ...current, isPay: false })}
          />
        </fieldset>
      </div>

      <div className='flex items-center gap-2'>
        <Segment
          fit
          label={summaryLabels.axis.label}
          onChange={(value) => load({ ...current, isType: value === 'type' })}
          options={[
            { value: 'type', label: summaryLabels.axis.type },
            { value: 'method', label: summaryLabels.axis.method }
          ]}
          size='sm'
          value={isType ? 'type' : 'method'}
        />
        {/* 共有モードは二人の家計を見るので、立替の区別そのものが無い。
            ペア未設定なら立て替える相手がいないので、どちらを選んでも同じ数字になる（D6）。 */}
        {isPair || !hasPair ? null : (
          <Segment
            className='ml-auto'
            fit
            label={summaryLabels.instead.label}
            onChange={(value) =>
              load({ ...current, isIncludeInstead: value === 'include' })
            }
            options={[
              { value: 'include', label: summaryLabels.instead.include },
              { value: 'onlyMe', label: summaryLabels.instead.onlyMe }
            ]}
            size='sm'
            value={isIncludeInstead ? 'include' : 'onlyMe'}
          />
        )}
      </div>

      <div
        aria-busy={isPending}
        className={cn('flex flex-col gap-3', isPending && 'opacity-60')}
      >
        <div className='flex justify-center rounded-2xl bg-card py-[18px]'>
          <Donut
            arcs={breakdown.arcs}
            label={totalLabel(kind)}
            total={breakdown.total}
          />
        </div>

        <div className='overflow-hidden rounded-2xl bg-card'>
          {breakdown.rows.length === 0 ? (
            <SectionListEmpty>{summaryLabels.empty.noData}</SectionListEmpty>
          ) : (
            breakdown.rows.map((row, index) => (
              <BreakdownCell
                isFirst={index === 0}
                key={`${row.id}-${row.name}`}
                row={row}
                toHref={(subTypeId, subTypeName) =>
                  recordsHref({
                    isType,
                    isPay,
                    isIncludeInstead,
                    yearMonth,
                    row,
                    subTypeId,
                    subTypeName
                  })
                }
              />
            ))
          )}
        </div>
      </div>

      {footnote === null ? null : (
        <span className='px-1 text-muted-foreground text-xs leading-relaxed'>
          {footnote}
        </span>
      )}

      {isPickerOpen ? (
        <MonthPickerSheet
          onOpenChange={setIsPickerOpen}
          onSelect={(next) => {
            setIsPickerOpen(false);
            load({ ...current, yearMonth: next });
          }}
          yearMonth={yearMonth}
        />
      ) : null}
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

// 支出／収入のピル。選択中は本文色の地に白文字、非選択は面の地。
function PayPill({
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

// 内訳の 1 行（＋サブカテゴリの子行）。押すとその絞り込みの明細へ進む。
function BreakdownCell({
  row,
  isFirst,
  toHref
}: {
  row: BreakdownRow;
  isFirst: boolean;
  toHref: (subTypeId: number | null, subTypeName: string | null) => string;
}) {
  const color = colorVar(row.colorName);
  const rowClass = 'flex h-14 items-center gap-3 px-3.5 text-foreground';
  const inner = (
    <>
      {/* 精算は実体のあるカテゴリではないので、塗らず輪郭だけで描く。 */}
      <span
        aria-hidden='true'
        className='size-2.5 shrink-0 rounded-full'
        style={
          row.isSettlement
            ? { border: `2px solid ${color}` }
            : { backgroundColor: color }
        }
      />
      <span className='flex min-w-0 flex-grow flex-col gap-1.5'>
        <span className='flex items-baseline gap-1.5 whitespace-nowrap'>
          {row.pairUserName === null ? null : (
            <span className='text-muted-foreground text-xs'>
              {row.pairUserName}
            </span>
          )}
          <span className='text-[15px]'>{row.name}</span>
          {row.isPair ? (
            <IconShare
              aria-label='共有'
              className='size-3.5 self-center text-primary'
              role='img'
              strokeWidth={2.2}
            />
          ) : null}
          <span className='text-muted-foreground text-xs'>{row.pctText}</span>
        </span>
        <span className='block h-1 rounded-sm bg-line-soft'>
          <span
            className='block h-1 rounded-sm'
            style={{ backgroundColor: color, width: `${row.pct}%` }}
          />
        </span>
      </span>
      <span className='font-semibold text-[15px]'>
        {row.value.toLocaleString('ja-JP')}
      </span>
      {/* 精算は明細へ進めないので、シェブロンの分だけ空ける。 */}
      {row.isSettlement ? (
        <span aria-hidden='true' className='w-3.5 shrink-0' />
      ) : (
        <IconChevronRight
          aria-hidden='true'
          className='size-3.5 shrink-0 text-icon-muted'
          strokeWidth={2.4}
        />
      )}
    </>
  );

  return (
    <div className={cn(!isFirst && 'border-border border-t')}>
      {/* 精算は type を持たないので明細で絞り込めない。行は出すが押せない。 */}
      {row.isSettlement ? (
        <div className={rowClass}>{inner}</div>
      ) : (
        <Link
          aria-label={`${row.name}の明細を見る`}
          className={rowClass}
          href={toHref(null, null)}
        >
          {inner}
        </Link>
      )}

      {row.subs.map((sub) => (
        <SubCell
          href={toHref(sub.id, sub.name)}
          key={sub.id ?? NO_SUB_TYPE_NAME}
          parentName={row.name}
          sub={sub}
        />
      ))}
    </div>
  );
}

function SubCell({
  sub,
  href,
  parentName
}: {
  sub: BreakdownSubRow;
  href: string;
  parentName: string;
}) {
  // 「サブカテゴリなし」は実体のある分類ではないので、文字を落として区別する。
  // 絞り込みの id が無いため明細へは進めない（親の明細がその分も含む）。
  const isNoSubType = sub.id === null;
  const rowClass = 'flex h-10 items-center pr-3.5 pl-9 text-foreground';
  const inner = (
    <span className='flex flex-grow items-center gap-2.5 self-stretch border-line-soft border-t'>
      <span className='flex flex-grow items-baseline gap-1.5'>
        <span className={cn('text-sm', isNoSubType && 'text-muted-foreground')}>
          {sub.name}
        </span>
        <span className='text-muted-foreground text-xs'>{sub.pctText}</span>
      </span>
      <span className='text-sm'>{sub.value.toLocaleString('ja-JP')}</span>
      {isNoSubType ? (
        <span aria-hidden='true' className='w-3.5 shrink-0' />
      ) : (
        <IconChevronRight
          aria-hidden='true'
          className='size-3.5 shrink-0 text-icon-muted'
          strokeWidth={2.4}
        />
      )}
    </span>
  );

  if (isNoSubType) {
    return <div className={rowClass}>{inner}</div>;
  }
  return (
    <Link
      aria-label={`${parentName} › ${sub.name}の明細を見る`}
      className={rowClass}
      href={href}
    >
      {inner}
    </Link>
  );
}
