'use client';

import { cn } from 'cn';
import { type ReactNode, useMemo, useState, useTransition } from 'react';
import { IconChevronLeft, IconChevronRight } from '@/components/icons';
import { PairModeSegment } from '@/components/pair-mode-segment';
import { SectionListEmpty } from '@/components/section-list';
import { ThemeToggle } from '@/components/theme-toggle';
import { Segment, type SegmentOption } from '@/components/ui/segment';
import { colorVar } from '@/features/master';
import { fetchPieAction } from '@/features/summary/actions';
import type { PieShowData } from '@/features/summary/domain/chart-data';
import { monthLabel, shiftMonth } from '@/features/summary/domain/period';
import { type BreakdownRow, buildBreakdown } from '../domain/breakdown';
import { Donut } from './donut';

// 集計（原典 Summary）。内訳だけを持ち、推移・精算はデザインが無いので押せないまま置く
// （README D10）。月移動と支出／収入の切替でカテゴリ別の集計を取り直す。
//
// カテゴリ／方法・立替込みの切替、サブカテゴリ行、明細への遷移はデザインに無いので
// 出さない。立替は個人モードは込み、共有モードは含めない。
//
// 「個人｜共有」の切替はページが再描画されて初期データが変わる。この画面の state は
// ページ側の key で作り直す。

type SummaryKind = 'breakdown' | 'trend' | 'settlement';

const KIND_OPTIONS: readonly SegmentOption<SummaryKind>[] = [
  { value: 'breakdown', label: '内訳' },
  { value: 'trend', label: '推移', disabled: true },
  { value: 'settlement', label: '精算', disabled: true }
];

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
  // 初期表示の月・支出の集計（Server で取得済み）。
  initialData: PieShowData;
  // ヘッダー左に置くもの（お知らせのベル）。
  headerLeft?: ReactNode;
}) {
  const [yearMonth, setYearMonth] = useState(initialYearMonth);
  const [isPay, setIsPay] = useState(true);
  const [data, setData] = useState(initialData);
  const [isPending, startTransition] = useTransition();

  // 取得中も前の内容を出したままにし、画面が空白になるのを避ける。
  const load = (next: { yearMonth: string; isPay: boolean }) => {
    setYearMonth(next.yearMonth);
    setIsPay(next.isPay);
    startTransition(async () => {
      setData(
        await fetchPieAction({
          isType: true,
          isPay: next.isPay,
          isPair,
          isIncludeInstead: !isPair,
          yearMonth: next.yearMonth
        })
      );
    });
  };

  const breakdown = useMemo(() => buildBreakdown(data.list), [data.list]);

  return (
    <div className='flex flex-col gap-3 px-4'>
      <div className='flex h-11 items-center justify-between'>
        <span>{headerLeft}</span>
        <div className='flex items-center gap-1.5'>
          <ThemeToggle />
          <PairModeSegment hasPair={hasPair} isPair={isPair} />
        </div>
      </div>

      <h1 className='font-bold text-3xl'>集計</h1>

      <Segment
        label='集計の種類'
        onChange={() => undefined}
        options={KIND_OPTIONS}
        value='breakdown'
      />

      <div className='flex items-center gap-1'>
        <MonthNavButton
          direction='prev'
          isPending={isPending}
          onClick={() => load({ yearMonth: shiftMonth(yearMonth, -1), isPay })}
        />
        <span className='font-semibold text-base'>{monthLabel(yearMonth)}</span>
        <MonthNavButton
          direction='next'
          isPending={isPending}
          onClick={() => load({ yearMonth: shiftMonth(yearMonth, 1), isPay })}
        />
        <fieldset aria-label='支出か収入か' className='ml-auto flex gap-1.5'>
          <PayPill
            isSelected={isPay}
            label='支出'
            onSelect={() => load({ yearMonth, isPay: true })}
          />
          <PayPill
            isSelected={!isPay}
            label='収入'
            onSelect={() => load({ yearMonth, isPay: false })}
          />
        </fieldset>
      </div>

      <div
        aria-busy={isPending}
        className={cn('flex flex-col gap-3', isPending && 'opacity-60')}
      >
        <div className='flex justify-center rounded-2xl bg-card py-[18px]'>
          <Donut
            arcs={breakdown.arcs}
            label={isPay ? '支出合計' : '収入合計'}
            total={breakdown.total}
          />
        </div>

        <div className='overflow-hidden rounded-2xl bg-card'>
          {breakdown.rows.length === 0 ? (
            <SectionListEmpty>表示するデータがありません</SectionListEmpty>
          ) : (
            breakdown.rows.map((row, index) => (
              <BreakdownCell
                isFirst={index === 0}
                key={`${row.id}-${row.name}`}
                row={row}
              />
            ))
          )}
        </div>
      </div>
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

// 内訳の 1 行。明細への遷移はデザインが無いので押せない（シェブロンは原典どおり出す）。
function BreakdownCell({
  row,
  isFirst
}: {
  row: BreakdownRow;
  isFirst: boolean;
}) {
  const color = colorVar(row.colorName);
  return (
    <div
      className={cn(
        'flex h-14 items-center gap-3 px-3.5',
        !isFirst && 'border-border border-t'
      )}
    >
      <span
        aria-hidden='true'
        className='size-2.5 shrink-0 rounded-full'
        style={{ backgroundColor: color }}
      />
      <span className='flex flex-grow flex-col gap-1.5'>
        <span className='flex items-baseline gap-2'>
          <span className='text-[15px]'>{row.name}</span>
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
      <IconChevronRight
        aria-hidden='true'
        className='size-3.5 shrink-0 text-icon-muted'
        strokeWidth={2.4}
      />
    </div>
  );
}
