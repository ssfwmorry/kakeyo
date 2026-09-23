'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { ColorClassification } from '@/features/master';
import { bankLabels } from '../labels';
import type {
  BalanceChartPoint,
  TableRow as BalanceTableRow,
  BankItem
} from '../types';
import { BankBalanceChart } from './bank-balance-chart';
import { BankBalanceDialog } from './bank-balance-dialog';
import { BankBalanceTable } from './bank-balance-table';
import { BankSettingTab } from './bank-setting-tab';

// bank 画面本体（/bank）。Server Component が組んだ BankScreenData と色マスタを受け、
// 残高チャート・履歴テーブルを表示する。「残高追加」で残高登録ダイアログを開き、
// 口座管理（追加/編集）は BankSettingTab を同画面に据えて導線とする。
// 表示専用の table/chart はそのまま利用する（見た目ロジックは各部品が持つ）。

type BankScreenProps = {
  banks: BankItem[];
  tableRows: BalanceTableRow[];
  chartPoints: BalanceChartPoint[];
  colors: ColorClassification[];
};

export function BankScreen({
  banks,
  tableRows,
  chartPoints,
  colors
}: BankScreenProps) {
  const [balanceOpen, setBalanceOpen] = useState(false);

  return (
    // 他画面（calendar / summary / records）と同じページ枠。これが無いと
    // チャートと残高テーブルだけが画面端まで張り出し、ボタン類との左右が揃わない。
    <main className='mx-auto flex w-full max-w-md flex-col gap-6 p-4'>
      <BankBalanceChart banks={banks} points={chartPoints} />

      <div className='flex justify-end'>
        <Button
          type='button'
          disabled={banks.length === 0}
          onClick={() => setBalanceOpen(true)}
        >
          {bankLabels.action.addBalance}
        </Button>
      </div>

      <BankBalanceTable banks={banks} rows={tableRows} />

      <BankSettingTab banks={banks} colors={colors} />

      <BankBalanceDialog
        open={balanceOpen}
        onOpenChange={setBalanceOpen}
        banks={banks}
      />
    </main>
  );
}
