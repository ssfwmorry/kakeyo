'use client';

import { getFormProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod/v4';
import Link from 'next/link';
import { useState } from 'react';
import { useCloseOnSuccess } from '@/components/form/use-close-on-success';
import { useFormAction } from '@/components/form/use-form-action';
import type { BankItem, TableRow } from '@/features/bank';
import { postBankBalancesAction } from '@/features/bank/actions';
import { bankBalanceFormSchema } from '@/features/bank/schemas/bank-balance-schema';
import { colorVar } from '@/features/master';
import { SheetHeader } from '@/v2/components/sheet-header';
import {
  BottomSheet,
  BottomSheetContent
} from '@/v2/components/ui/bottom-sheet';
import { SheetSubmitButton } from '@/v2/components/ui/sheet-submit-button';
import { formatSlashDate } from '@/v2/lib/format';
import { useSubmissionErrorToast } from '@/v2/lib/submission-error';

// 残高を登録するシート（原典 Bank の「残高を登録」）。
//
// 全口座が最初から並び、打った口座だけが登録される。placeholder にその口座の最新残高を
// 出しておくと、変わっていない口座は空のまま飛ばせて、変わった口座だけ打てばよい。
// 口座が足りなければ「＋ 口座の行を追加」で設定›口座の追加シートへ送る。
//
// スキーマ（bankBalanceFormSchema）は rows の全行に金額を要求するので、
// 空欄のまま送ると「1 件だけ登録したいのに全部エラー」になる。そこで入力のある行だけを
// 詰め直してから送る。スキーマとサーバ側は旧画面と共有したまま変えない。

export function BalanceSheet({
  isOpen,
  onOpenChange,
  banks,
  latest,
  today
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  banks: BankItem[];
  // 最新の記録行。placeholder（各口座の最新残高）に使う。無ければ 0。
  latest: TableRow | undefined;
  // 記録日の表示。JST の今日を SSR 側で確定して渡す。
  today: string;
}) {
  const [result, action, isPending] = useFormAction(postBankBalancesAction);
  const [form] = useForm({
    lastResult: result?.submission,
    onValidate: ({ formData }) =>
      parseWithZod(formData, { schema: bankBalanceFormSchema })
  });
  useCloseOnSuccess(result, onOpenChange);
  // 金額の形式エラーは行の下に出す場所が無いので、トーストでまとめて伝える。
  useSubmissionErrorToast(result);

  // 1 口座でも打ってあれば送れる。空欄行は送らないので、全部空なら押せない。
  const [hasInput, setHasInput] = useState(false);
  const syncHasInput = (formElement: HTMLFormElement) => {
    setHasInput(
      banks.some((bank) => priceInput(formElement, bank.id)?.value.trim())
    );
  };

  // 入力のある口座だけを rows[0], rows[1] … と詰め直す。
  // 元のフィールドは name を持たせず（下の BalanceRow 参照）、ここで組み立てる。
  const buildFormData = (formElement: HTMLFormElement): FormData => {
    const next = new FormData();
    let index = 0;
    for (const bank of banks) {
      const value = priceInput(formElement, bank.id)?.value.trim() ?? '';
      if (value === '') {
        continue;
      }
      next.set(`rows[${index}].bankId`, String(bank.id));
      next.set(`rows[${index}].price`, value);
      index++;
    }
    return next;
  };

  return (
    <BottomSheet onOpenChange={onOpenChange} open={isOpen}>
      <BottomSheetContent gap={12}>
        <SheetHeader
          left='close'
          onLeft={() => onOpenChange(false)}
          title='残高を登録'
        />

        <div className='flex h-12 shrink-0 items-center rounded-[14px] bg-card px-3.5'>
          <span className='flex-grow text-[15px]'>記録日</span>
          <span className='flex h-8 items-center rounded-lg bg-background px-2.5 text-[15px]'>
            {formatSlashDate(today)}
          </span>
        </div>

        <form
          {...getFormProps(form)}
          action={action}
          className='flex min-h-0 flex-1 flex-col gap-3'
          onChange={(event) => syncHasInput(event.currentTarget)}
          // action に渡る FormData を差し替える。onSubmit で止めて自分で dispatch する。
          onSubmit={(event) => {
            event.preventDefault();
            action(buildFormData(event.currentTarget));
          }}
        >
          <div className='overflow-hidden rounded-[14px] bg-card'>
            {banks.map((bank, index) => (
              <BalanceRow
                bank={bank}
                isFirst={index === 0}
                key={bank.id}
                placeholder={latest?.bankPrices[index] ?? null}
              />
            ))}
          </div>

          <Link
            className='flex h-10 items-center self-start px-1 font-semibold text-[15px] text-primary'
            href='/v2/setting/bank?add=1'
          >
            ＋ 口座の行を追加
          </Link>

          <SheetSubmitButton
            className='mt-auto'
            disabled={!hasInput || isPending}
            disabledLabel='残高を入れると登録できます'
            label='登録する'
          />
        </form>
      </BottomSheetContent>
    </BottomSheet>
  );
}

function priceInput(
  formElement: HTMLFormElement,
  bankId: number
): HTMLInputElement | null {
  return formElement.elements.namedItem(
    `price-${bankId}`
  ) as HTMLInputElement | null;
}

// 1 口座ぶんの行。
//
// name は rows[i] ではなく price-<bankId> にしておき、送る形は親が組み立てる
// （空欄の口座を rows から外すため）。
function BalanceRow({
  bank,
  isFirst,
  placeholder
}: {
  bank: BankItem;
  isFirst: boolean;
  // その口座の最新残高。無ければ null。
  placeholder: number | null;
}) {
  return (
    <>
      {isFirst ? null : <div className='ml-9 h-px bg-border' />}
      <label className='flex h-13 items-center gap-3 px-3.5'>
        <span
          aria-hidden='true'
          className='size-2.5 shrink-0 rounded-full'
          style={{ backgroundColor: colorVar(bank.colorName) }}
        />
        <span className='flex-grow text-[15px]'>{bank.name}</span>
        <input
          className='w-30 bg-transparent text-right font-semibold text-[17px] text-foreground outline-none placeholder:text-muted-foreground/60'
          inputMode='numeric'
          name={`price-${bank.id}`}
          placeholder={
            placeholder === null ? '0' : placeholder.toLocaleString('ja-JP')
          }
          type='text'
        />
        <span className='text-muted-foreground text-sm'>円</span>
      </label>
    </>
  );
}
