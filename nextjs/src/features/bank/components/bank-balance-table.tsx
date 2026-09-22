import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { toManUnit } from '../domain/format';
import { bankLabels } from '../labels';
import type { TableRow as BalanceTableRow, BankItem } from '../types';

// 残高履歴テーブル。記録日 × 合計 × 各口座の残高。万単位表示（ConvertManUnit 相当）。
// 未登録セルは全角スペース付きの '-　' で表示（旧 Nuxt の見た目を踏襲）。

// number|null を万単位表示に整形。null（未登録）は '-　'。
function formatCell(value: number | null): string {
  if (value === null) {
    return '-　';
  }
  return toManUnit(value).toLocaleString();
}

type BankBalanceTableProps = {
  banks: BankItem[];
  rows: BalanceTableRow[];
};

export function BankBalanceTable({ banks, rows }: BankBalanceTableProps) {
  if (rows.length === 0) {
    return (
      <p className='py-8 text-center text-muted-foreground'>
        {bankLabels.empty.balanceHistory}
      </p>
    );
  }

  return (
    <div className='overflow-x-auto'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='text-center'>
              {bankLabels.field.recordDate}
            </TableHead>
            <TableHead className='text-center'>
              {bankLabels.field.total}
            </TableHead>
            {banks.map((bank) => (
              <TableHead key={bank.id} className='text-center'>
                {bank.name}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.createdDate}>
              <TableCell className='text-center'>{row.createdDate}</TableCell>
              <TableCell className='text-right'>
                {formatCell(row.sum)}
              </TableCell>
              {banks.map((bank, index) => (
                <TableCell key={bank.id} className='text-right'>
                  {formatCell(row.bankPrices[index] ?? null)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
