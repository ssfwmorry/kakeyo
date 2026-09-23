'use client';

import { useState } from 'react';
import { IconPencil } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import type { ColorClassification } from '@/features/master';
import { colorHex } from '@/features/master';
import { L } from '@/lib/shared/labels';
import { bankLabels } from '../labels';
import type { BankItem } from '../types';
import { BankFormDialog } from './bank-form-dialog';

// 個人モード専用データだが、表示可否の最終判定は setting 統合側の責務のため、ここは
// 「渡されたら表示」に徹する（呼び出し側が個人モード時のみ描画する）。

type BankSettingTabProps = {
  banks: BankItem[];
  colors: ColorClassification[];
};

type DialogState =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; bank: BankItem };

export function BankSettingTab({ banks, colors }: BankSettingTabProps) {
  const [dialog, setDialog] = useState<DialogState>({ kind: 'closed' });

  return (
    <section className='flex flex-col gap-3'>
      <h2 className='text-base font-medium'>{bankLabels.heading.bank}</h2>

      <div className='grid grid-cols-2 gap-2'>
        {banks.map((bank) => (
          <BankCardView
            key={bank.id}
            bank={bank}
            onEdit={() => setDialog({ kind: 'edit', bank })}
          />
        ))}
      </div>

      <div className='flex justify-end'>
        <Button type='button' onClick={() => setDialog({ kind: 'create' })}>
          ＋
        </Button>
      </div>

      <BankFormDialog
        // 編集対象ごとにリマウントして defaultValue のプリフィルを効かせる。
        key={dialog.kind === 'edit' ? dialog.bank.id : 'new'}
        open={dialog.kind !== 'closed'}
        onOpenChange={(open) =>
          open ? undefined : setDialog({ kind: 'closed' })
        }
        colors={colors}
        editing={dialog.kind === 'edit' ? dialog.bank : undefined}
      />
    </section>
  );
}

type BankCardViewProps = {
  bank: BankItem;
  onEdit: () => void;
};

function BankCardView({ bank, onEdit }: BankCardViewProps) {
  return (
    <Card size='sm'>
      <CardHeader layout='row'>
        <span className='flex items-center gap-2'>
          <span
            className='inline-block size-5 rounded-full'
            style={{ backgroundColor: colorHex(bank.colorName) }}
          />
          {bank.name}
        </span>
        <Button
          type='button'
          size='icon'
          variant='ghost'
          aria-label={L.button.edit}
          onClick={onEdit}
        >
          <IconPencil className='size-4' />
        </Button>
      </CardHeader>
    </Card>
  );
}
