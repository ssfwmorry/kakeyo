'use client';

import { useState } from 'react';
import type { BankItem, TableRow } from '@/features/bank';
import { colorVar } from '@/features/master';
import { formatDateLabelJst } from '@/lib/shared/domain/date';
import { ScreenTitle } from '@/v2/components/screen-title';
import { ThemeToggle } from '@/v2/components/theme-toggle';
import { BalanceSheet } from './balance-sheet';
import { TotalTrendChart } from './total-trend-chart';

// 口座（新デザイン）。総資産・推移・口座別の残高を上から積む。
//
// 旧画面は口座ごとの積み上げ Area と残高テーブルを並べていたが、新デザインでは
// 「いま合計いくらか」を最初に出し、推移は総資産 1 本の折れ線にする（デザイン基礎 Bank）。
// 口座ごとの内訳はその下のリストで見せる。
//
// 残高の登録は見出し横のボタンからシートで開く。全口座が並び、打った口座だけが登録される。

export function BankScreen({
  banks,
  tableRows,
  today
}: {
  banks: BankItem[];
  // 記録日ごとの残高（前行引き継ぎ済み）。末尾が最新。
  tableRows: TableRow[];
  today: string;
}) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const latest = tableRows.at(-1);

  return (
    <div className='flex flex-col gap-3 px-4'>
      <div className='flex h-11 items-center justify-end'>
        <ThemeToggle />
      </div>

      <div className='flex items-center'>
        <ScreenTitle>口座</ScreenTitle>
        <button
          className='ml-auto h-9 rounded-full bg-secondary px-3.5 font-semibold text-primary text-sm'
          onClick={() => setIsSheetOpen(true)}
          type='button'
        >
          ＋ 残高を登録
        </button>
      </div>

      <TotalCard rows={tableRows} />
      <BankList banks={banks} latest={latest} />

      {isSheetOpen ? (
        <BalanceSheet
          banks={banks}
          isOpen
          onOpenChange={setIsSheetOpen}
          today={today}
        />
      ) : null}
    </div>
  );
}

// 総資産と推移。
function TotalCard({ rows }: { rows: TableRow[] }) {
  const latest = rows.at(-1);
  // 増減は「最新」と「その 1 つ前の記録」の差。記録の間隔は利用者任せなので、
  // 暦月ではなく登録の前後で比べる。
  const previous = rows.at(-2);
  const diff =
    latest?.sum != null && previous?.sum != null
      ? latest.sum - previous.sum
      : null;

  return (
    <section className='flex flex-col gap-2.5 rounded-2xl bg-card p-4'>
      <span className='text-[13px] text-muted-foreground'>
        総資産（
        {latest === undefined
          ? '未登録'
          : `${formatDateLabelJst(latest.createdDate)} 時点`}
        ）
      </span>
      <div className='flex items-baseline gap-2'>
        <span className='font-bold text-3xl tabular-nums'>
          {latest?.sum == null ? '—' : latest.sum.toLocaleString('ja-JP')}
        </span>
        <span className='font-semibold text-[15px]'>円</span>
        {diff === null ? null : (
          <span className='ml-auto font-semibold text-[13px] text-primary'>
            前回比 {diff >= 0 ? '+' : '−'}
            {Math.abs(diff).toLocaleString('ja-JP')}
          </span>
        )}
      </div>
      <TotalTrendChart rows={rows} />
    </section>
  );
}

// 口座ごとの最新残高。
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
          <div
            className={`flex h-13 items-center gap-3 px-3.5 ${index === 0 ? '' : 'border-t'}`}
            key={bank.id}
          >
            <span
              aria-hidden='true'
              className='size-2.5 shrink-0 rounded-full'
              style={{ backgroundColor: colorVar(bank.colorName) }}
            />
            <span className='flex-grow text-[15px]'>{bank.name}</span>
            <span className='font-semibold text-[15px] tabular-nums'>
              {price == null ? '—' : price.toLocaleString('ja-JP')}
            </span>
          </div>
        );
      })}
    </div>
  );
}
