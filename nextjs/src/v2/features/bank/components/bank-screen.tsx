'use client';

import Link from 'next/link';
import { type ReactNode, useState } from 'react';
import { IconChevronRight } from '@/components/icons';
import type { BankItem, TableRow } from '@/features/bank';
import { colorVar } from '@/features/master';
import { ThemeToggle } from '@/v2/components/theme-toggle';
import { formatSignedPrice, formatSlashMonthDay } from '@/v2/lib/format';
import { buildMonthEndTrend } from '../domain/month-ends';
import { BalanceSheet } from './balance-sheet';
import { TotalTrendChart } from './total-trend-chart';

// 口座（原典 Bank）。総資産・推移・口座別の残高を上から積む。個人専用の画面なので
// 「個人｜共有」は出さない。
//
// 「いま合計いくらか」を最初に出し、推移は総資産 1 本の折れ線にする。口座ごとの内訳は
// その下のリストで見せ、口座そのものの増減は設定›口座で行う。
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
  const latest = tableRows.at(-1);

  return (
    <div className='flex flex-col gap-3 px-4'>
      <div className='flex h-11 items-center justify-between'>
        <span>{headerLeft}</span>
        <ThemeToggle />
      </div>

      <div className='flex items-center'>
        <h1 className='font-bold text-3xl'>口座</h1>
        <button
          className='ml-auto h-9 rounded-full bg-secondary px-3.5 font-semibold text-primary text-sm'
          onClick={() => setIsSheetOpen(true)}
          type='button'
        >
          ＋ 残高を登録
        </button>
      </div>

      <TotalCard latest={latest} rows={tableRows} today={today} />

      <div className='-mb-1 flex items-center px-1'>
        <span className='flex-grow text-[13px] text-muted-foreground'>
          口座ごとの残高
        </span>
        <Link
          className='flex h-8 items-center gap-0.5 font-semibold text-primary text-sm'
          href='/v2/setting/bank'
        >
          口座を編集
          <IconChevronRight
            aria-hidden='true'
            className='size-3.5'
            strokeWidth={2.4}
          />
        </Link>
      </div>
      <BankList banks={banks} latest={latest} />

      {isSheetOpen ? (
        <BalanceSheet
          banks={banks}
          isOpen
          latest={latest}
          onOpenChange={setIsSheetOpen}
          today={today}
        />
      ) : null}
    </div>
  );
}

// 総資産と推移。先月比は「今月末時点 − 先月末時点」で、出せないときは出さない。
function TotalCard({
  rows,
  latest,
  today
}: {
  rows: TableRow[];
  latest: TableRow | undefined;
  today: string;
}) {
  const trend = buildMonthEndTrend(rows, today);
  const diff = trend?.lastMonthDiff ?? null;

  return (
    <section className='flex flex-col gap-2.5 rounded-2xl bg-card p-4'>
      <span className='text-[13px] text-muted-foreground'>
        総資産（
        {latest === undefined
          ? '未登録'
          : `${formatSlashMonthDay(latest.createdDate)} 時点`}
        ）
      </span>
      <div className='flex items-baseline gap-2'>
        <span className='font-bold text-3xl'>
          {latest?.sum == null ? '—' : latest.sum.toLocaleString('ja-JP')}
        </span>
        <span className='font-semibold text-[15px]'>円</span>
        {diff === null ? null : (
          <span className='ml-auto font-semibold text-[13px] text-primary'>
            先月比 {formatSignedPrice(Math.abs(diff), diff < 0)}
          </span>
        )}
      </div>
      {trend === null ? null : <TotalTrendChart trend={trend} />}
    </section>
  );
}

// 口座ごとの最新残高。区切り線は色の丸の右から。
function BankList({
  banks,
  latest
}: {
  banks: BankItem[];
  latest: TableRow | undefined;
}) {
  if (banks.length === 0) {
    return (
      <p className='px-1 text-muted-foreground text-sm'>
        口座がまだありません。設定から追加してください。
      </p>
    );
  }
  if (latest === undefined) {
    return (
      <p className='px-1 text-muted-foreground text-sm'>
        残高がまだ登録されていません。
      </p>
    );
  }

  return (
    <div className='overflow-hidden rounded-2xl bg-card'>
      {banks.map((bank, index) => {
        // bankPrices は banks と同じ並び（balance-table の仕様）。
        const price = latest.bankPrices[index];
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
