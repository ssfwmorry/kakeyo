'use client';

import { cn } from 'cn';
import Link from 'next/link';
import { type ReactNode, useMemo, useState } from 'react';
import { IconChevronRight } from '@/components/icons';
import { StackedBarChart } from '@/components/stacked-bar-chart';
import { ThemeToggle } from '@/components/theme-toggle';
import { Segment } from '@/components/ui/segment';
import type { BankItem, TableRow } from '@/features/bank';
import { colorVar } from '@/features/master';
import {
  diffToneClass,
  formatPrice,
  formatSlashMonthDay,
  formatYearMonthJa
} from '@/lib/shared/domain/format';
import { buildBalanceBars } from '../domain/balance-bars';
import {
  type BalanceBucket,
  bucketDiff,
  buildBalanceBuckets,
  latestBucketKey
} from '../domain/balance-buckets';
import {
  DEFAULT_RANGE,
  HISTORY_RANGES,
  type HistoryRange
} from '../domain/history-range';
import { bankLabels } from '../labels';
import { BalanceSheet } from './balance-sheet';

// 口座（原典 Bank）。総資産・推移・口座別の残高を上から積む。個人専用の画面なので
// 「個人｜共有」は出さない。
//
// 「いま合計いくらか」を最初に出し、推移は口座を積み上げた棒で内訳ごと見せる。
// 棒をタップすると総資産の値と下の口座リストがその区間の値に切り替わるので、
// グラフ内に凡例や目盛りは置かない（口座リストの色の丸が凡例を兼ねる）。
// 口座そのものの増減は設定›口座で行う。
//
// 残高の登録は見出し横のボタンからシートで開く。全口座が並び、打った口座だけが登録される。

export function BankScreen({
  banks,
  tableRows,
  today,
  headerLeft
}: {
  banks: BankItem[];
  // 記録日ごとの残高（前行引き継ぎ済み）。末尾が最新。
  tableRows: TableRow[];
  today: string;
  // ヘッダー左に置くもの（お知らせのベル）。
  headerLeft?: ReactNode;
}) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [range, setRange] = useState<HistoryRange>(DEFAULT_RANGE);
  // 選んだ区間。null は「値のある最新の区間」で、期間を切り替えたらそこへ戻す。
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const buckets = useMemo(
    () => buildBalanceBuckets(tableRows, today, range),
    [tableRows, today, range]
  );
  const currentKey = selectedKey ?? latestBucketKey(buckets);
  const selectedIndex = buckets.findIndex(
    (bucket) => bucket.key === currentKey
  );
  // 記録が 1 つも無ければどちらも undefined。
  const selected = buckets[selectedIndex];
  const previous = buckets[selectedIndex - 1];

  return (
    <div className='flex flex-col gap-3 px-3'>
      <div className='flex h-11 items-center justify-between'>
        <span>{headerLeft}</span>
        <ThemeToggle />
      </div>

      <div className='flex items-center'>
        <h1 className='font-bold text-2xl'>{bankLabels.heading.bank}</h1>
        <button
          className='ml-auto h-9 rounded-full bg-secondary px-3.5 font-semibold text-primary text-sm'
          onClick={() => setIsSheetOpen(true)}
          type='button'
        >
          ＋ 残高を登録
        </button>
      </div>

      <TotalCard
        banks={banks}
        buckets={buckets}
        onChangeRange={(next) => {
          setRange(next);
          setSelectedKey(null);
        }}
        onSelect={setSelectedKey}
        previous={previous}
        range={range}
        selected={selected}
        today={today}
      />

      <div className='-mb-1 flex items-center px-1'>
        <span className='flex-grow text-[13px] text-muted-foreground'>
          口座ごとの残高
        </span>
        <Link
          className='flex h-8 items-center gap-0.5 font-semibold text-primary text-sm'
          href='/setting/bank'
        >
          口座を編集
          <IconChevronRight
            aria-hidden='true'
            className='size-3.5'
            strokeWidth={2.4}
          />
        </Link>
      </div>
      <BankList banks={banks} prices={selected?.prices} />

      {isSheetOpen ? (
        <BalanceSheet
          banks={banks}
          isOpen
          latest={tableRows.at(-1)}
          onOpenChange={setIsSheetOpen}
          today={today}
        />
      ) : null}
    </div>
  );
}

// 総資産と推移。値は選んでいる区間のもので、差分はその 1 つ前の区間との差。
// 「時点」には区間末日ではなく採用した記録日を出す（5 月の棒で「4/30 時点」なら
// 5 月は記録が無かったと読める）。
function TotalCard({
  banks,
  buckets,
  range,
  selected,
  previous,
  today,
  onChangeRange,
  onSelect
}: {
  banks: BankItem[];
  buckets: BalanceBucket[];
  range: HistoryRange;
  // 選んでいる区間とその 1 つ前。無ければ undefined。
  selected: BalanceBucket | undefined;
  previous: BalanceBucket | undefined;
  today: string;
  onChangeRange: (range: HistoryRange) => void;
  onSelect: (key: string) => void;
}) {
  const chart = buildBalanceBars(buckets, banks, colorVar);
  const diff = bucketDiff(selected, previous);
  const asOf = selected?.asOfDate ?? null;

  return (
    <section className='flex flex-col gap-2.5 rounded-2xl bg-card p-4'>
      <div className='flex items-center'>
        <span className='text-[13px] text-muted-foreground'>
          {bankLabels.history.chartTarget}（
          {asOf === null
            ? '未登録'
            : `${formatSlashMonthDay(asOf, { today })} 時点`}
          ）
        </span>
        <Segment
          className='ml-auto'
          fit
          label={bankLabels.history.rangeLabel}
          onChange={onChangeRange}
          options={HISTORY_RANGES.map((value) => ({
            value,
            label: bankLabels.history.range[value]
          }))}
          size='sm'
          tone='background'
          value={range}
        />
      </div>
      <div className='flex items-baseline gap-2'>
        <span className='font-bold text-3xl'>
          {selected?.sum == null ? '—' : selected.sum.toLocaleString('ja-JP')}
        </span>
        <span className='font-semibold text-[15px]'>円</span>
        {diff === null ? null : (
          <span
            className={cn(
              'ml-auto font-semibold text-[13px]',
              diffToneClass(diff)
            )}
          >
            {bankLabels.history.diff[range]} {formatPrice(diff)}
          </span>
        )}
      </div>
      {selected === undefined ? null : (
        <StackedBarChart
          bars={chart.bars}
          onSelect={onSelect}
          selectedKey={selected.key}
          toAriaLabel={(bar) =>
            `${formatYearMonthJa(bar.key)} ${bankLabels.history.chartTarget} ${bar.value.toLocaleString('ja-JP')}円`
          }
          zeroTop={chart.zeroTop}
        />
      )}
    </section>
  );
}

// 口座ごとの残高（選んでいる区間の値）。区切り線は色の丸の右から。
function BankList({
  banks,
  prices
}: {
  banks: BankItem[];
  // banks と同じ並び（balance-table の仕様）。記録が無ければ undefined。
  prices: (number | null)[] | undefined;
}) {
  if (banks.length === 0) {
    return (
      <p className='px-1 text-muted-foreground text-sm'>
        口座がまだありません。設定から追加してください。
      </p>
    );
  }
  if (prices === undefined) {
    return (
      <p className='px-1 text-muted-foreground text-sm'>
        残高がまだ登録されていません。
      </p>
    );
  }

  return (
    <div className='overflow-hidden rounded-2xl bg-card'>
      {banks.map((bank, index) => {
        const price = prices[index];
        return (
          <div key={bank.id}>
            {index === 0 ? null : <div className='ml-9 h-px bg-border' />}
            <div className='flex h-13 items-center gap-3 px-3.5'>
              <span
                aria-hidden='true'
                className='size-2.5 shrink-0 rounded-full'
                style={{ backgroundColor: colorVar(bank.colorName) }}
              />
              <span className='flex-grow text-[15px]'>{bank.name}</span>
              <span className='font-semibold text-[15px]'>
                {price == null ? '—' : price.toLocaleString('ja-JP')}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
