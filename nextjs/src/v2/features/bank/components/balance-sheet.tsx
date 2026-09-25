'use client';

import { getFormProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod/v4';
import { useCloseOnSuccess } from '@/components/form/use-close-on-success';
import { useFormAction } from '@/components/form/use-form-action';
import type { BankItem } from '@/features/bank';
import { postBankBalancesAction } from '@/features/bank/actions';
import { bankBalanceFormSchema } from '@/features/bank/schemas/bank-balance-schema';
import { colorVar } from '@/features/master';
import { formatDateLabelJst } from '@/lib/shared/domain/date';
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetTitle
} from '@/v2/components/ui/bottom-sheet';
import { Button } from '@/v2/components/ui/button';

// 残高を登録するシート。
//
// 旧ダイアログは「口座を選ぶ行」を足していく可変行だったが、新デザインでは全口座が
// 最初から並び、打った口座だけが登録される（デザイン基礎 Bank）。口座は数件なので
// 選ばせる必要がなく、行の追加・削除の操作もなくなる。
//
// スキーマ（bankBalanceFormSchema）は rows の全行に金額を要求するので、
// 空欄のまま送ると「1 件だけ登録したいのに全部エラー」になる。そこで入力のある行だけを
// 詰め直してから送る。スキーマとサーバ側は旧画面と共有したまま変えない。

export function BalanceSheet({
  isOpen,
  onOpenChange,
  banks,
  today
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  banks: BankItem[];
  // 記録日の表示。JST の今日を SSR 側で確定して渡す。
  today: string;
}) {
  const [result, action] = useFormAction(postBankBalancesAction);
  const [form, fields] = useForm({
    lastResult: result?.submission,
    onValidate: ({ formData }) =>
      parseWithZod(formData, { schema: bankBalanceFormSchema })
  });
  useCloseOnSuccess(result, onOpenChange);

  // 入力のある口座だけを rows[0], rows[1] … と詰め直す。
  // 元のフィールドは name を持たせず（下の BalanceRow 参照）、ここで組み立てる。
  const buildFormData = (formElement: HTMLFormElement): FormData => {
    const next = new FormData();
    let index = 0;
    for (const bank of banks) {
      const input = formElement.elements.namedItem(
        `price-${bank.id}`
      ) as HTMLInputElement | null;
      const value = input?.value.trim() ?? '';
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
      <BottomSheetContent>
        <div className='grid h-10 grid-cols-[1fr_auto_1fr] items-center'>
          <button
            className='justify-self-start text-base text-primary'
            onClick={() => onOpenChange(false)}
            type='button'
          >
            キャンセル
          </button>
          <BottomSheetTitle>残高を登録</BottomSheetTitle>
          <span />
        </div>

        <div className='flex h-12 items-center rounded-2xl bg-card px-3.5'>
          <span className='flex-grow text-[15px]'>記録日</span>
          <span className='flex h-8 items-center rounded-lg bg-background px-2.5 text-[15px]'>
            {formatDateLabelJst(today)}
          </span>
        </div>

        <form
          {...getFormProps(form)}
          action={action}
          className='flex flex-col gap-3'
          // action に渡る FormData を差し替える。onSubmit で止めて自分で dispatch する。
          onSubmit={(event) => {
            event.preventDefault();
            action(buildFormData(event.currentTarget));
          }}
        >
          <div className='overflow-hidden rounded-2xl bg-card'>
            {banks.map((bank, index) => (
              <BalanceRow bank={bank} isFirst={index === 0} key={bank.id} />
            ))}
          </div>

          {fields.rows.errors ? (
            <p className='px-1 text-destructive text-sm' role='alert'>
              {fields.rows.errors.join(' / ')}
            </p>
          ) : null}

          <Button className='w-full' type='submit'>
            登録する
          </Button>
        </form>
      </BottomSheetContent>
    </BottomSheet>
  );
}

// 1 口座ぶんの行。
//
// name は rows[i] ではなく price-<bankId> にしておき、送る形は親が組み立てる
// （空欄の口座を rows から外すため）。
function BalanceRow({ bank, isFirst }: { bank: BankItem; isFirst: boolean }) {
  return (
    <label
      className={`flex h-13 items-center gap-3 px-3.5 ${isFirst ? '' : 'border-t'}`}
    >
      <span
        aria-hidden='true'
        className='size-2.5 shrink-0 rounded-full'
        style={{ backgroundColor: colorVar(bank.colorName) }}
      />
      <span className='flex-grow text-[15px]'>{bank.name}</span>
      <input
        className='w-30 bg-transparent text-right font-semibold text-[17px] text-foreground outline-none'
        inputMode='numeric'
        name={`price-${bank.id}`}
        placeholder='0'
        type='text'
      />
      <span className='text-muted-foreground text-sm'>円</span>
    </label>
  );
}
