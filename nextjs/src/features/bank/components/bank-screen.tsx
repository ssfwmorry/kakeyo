'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { bankLabels } from '../labels';
import type {
  BalanceChartPoint,
  TableRow as BalanceTableRow,
  BankItem
} from '../types';
import { BankBalanceChart } from './bank-balance-chart';
import { BankBalanceDialog } from './bank-balance-dialog';
import { BankBalanceTable } from './bank-balance-table';

// bank 画面本体（/bank）。Server Component が組んだ BankScreenData を受け、
// 残高チャート・履歴テーブルを表示する。「残高追加」で残高登録ダイアログを開く。
// 口座そのものの追加/編集（マスタ管理）は他のマスタと同じく設定画面（/setting の
// 家計管理タブ）に一本化し、この画面は残高の閲覧・登録に徹する。
// 口座が 1 件も無いと残高登録ができず行き止まりになるため、その場合だけ
// 設定画面への案内を出す。
// 表示専用の table/chart はそのまま利用する（見た目ロジックは各部品が持つ）。

type BankScreenProps = {
  banks: BankItem[];
  tableRows: BalanceTableRow[];
  chartPoints: BalanceChartPoint[];
};

export function BankScreen({ banks, tableRows, chartPoints }: BankScreenProps) {
  const [balanceOpen, setBalanceOpen] = useState(false);

  return (
    // 他画面（calendar / summary / records）と同じページ枠。これが無いと
    // チャートと残高テーブルだけが画面端まで張り出し、ボタン類との左右が揃わない。
    <main className='flex flex-col gap-6 p-4'>
      {banks.length === 0 ? (
        <NoBankGuide />
      ) : (
        <>
          <BankBalanceChart banks={banks} points={chartPoints} />

          <div className='flex justify-end'>
            <Button type='button' onClick={() => setBalanceOpen(true)}>
              {bankLabels.action.addBalance}
            </Button>
          </div>

          <BankBalanceTable banks={banks} rows={tableRows} />

          <BankBalanceDialog
            open={balanceOpen}
            onOpenChange={setBalanceOpen}
            banks={banks}
          />
        </>
      )}
    </main>
  );
}

// 口座未登録時の案内。口座マスタは設定画面で管理するため、そこへ誘導する。
function NoBankGuide() {
  return (
    <div className='flex flex-col items-center gap-4 py-8'>
      <p className='text-center text-muted-foreground text-sm'>
        {bankLabels.empty.noBank}
      </p>
      <Link href='/setting' className={buttonVariants({ variant: 'default' })}>
        {bankLabels.action.goSetting}
      </Link>
    </div>
  );
}
