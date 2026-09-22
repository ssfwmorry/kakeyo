'use client';

import {
  type FieldMetadata,
  getFormProps,
  getInputProps,
  getSelectProps,
  useForm
} from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod/v4';
import type { ComponentProps } from 'react';
import { useCloseOnSuccess } from '@/components/form/use-close-on-success';
import { useFormAction } from '@/components/form/use-form-action';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { postBankBalancesAction } from '../actions';
import { bankLabels } from '../labels';
import { bankBalanceFormSchema } from '../schemas/bank-balance-schema';
import type { BankItem } from '../types';

// 口座残高（bank_balance）の登録ダイアログ。可変行（口座 × 残高）を Conform の
// 配列フィールド（fields.rows.getFieldList()）で扱う。行追加/削除は Conform の
// insert/remove intent ボタンで行い、上限は口座数。同一口座の重複はスキーマ側で
// フォームエラーになる（bank-balance-schema.superRefine）。price は文字列で送り、
// server 側の priceSchema が正規化・検証する（ここでは素の数値変換をしない）。

type BankBalanceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  banks: BankItem[];
};

// Select の見た目（shadcn SelectTrigger 相当）を native select に与える共通クラス。
const selectClassName =
  'flex h-8 w-full items-center rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive';

export function BankBalanceDialog({
  open,
  onOpenChange,
  banks
}: BankBalanceDialogProps) {
  const [result, action] = useFormAction(postBankBalancesAction);
  const [form, fields] = useForm({
    lastResult: result?.submission,
    defaultValue: { rows: [{ bankId: '', price: '' }] },
    onValidate: ({ formData }) =>
      parseWithZod(formData, { schema: bankBalanceFormSchema })
  });

  useCloseOnSuccess(result, onOpenChange);

  const rows = fields.rows.getFieldList();
  const canAddRow = rows.length < banks.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{bankLabels.heading.balanceRegister}</DialogTitle>
        </DialogHeader>
        <form
          {...getFormProps(form)}
          action={action}
          className='flex flex-col gap-4'
        >
          <div className='flex flex-col gap-3'>
            {rows.map((row, index) => {
              const rowFields = row.getFieldset();
              return (
                <BalanceRow
                  key={row.key}
                  bankIdField={rowFields.bankId}
                  priceField={rowFields.price}
                  banks={banks}
                  removeButtonProps={form.remove.getButtonProps({
                    name: fields.rows.name,
                    index
                  })}
                  canRemove={rows.length > 1}
                />
              );
            })}
          </div>
          {fields.rows.errors ? (
            <p className='text-sm text-red-600' role='alert'>
              {fields.rows.errors.join(' / ')}
            </p>
          ) : null}
          <div className='flex justify-end'>
            <Button
              type='button'
              size='sm'
              variant='secondary'
              disabled={!canAddRow}
              {...form.insert.getButtonProps({ name: fields.rows.name })}
            >
              {bankLabels.action.addRow}
            </Button>
          </div>
          <DialogFooter>
            <Button type='submit'>{bankLabels.action.register}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type BalanceRowProps = {
  bankIdField: FieldMetadata<unknown>;
  priceField: FieldMetadata<unknown>;
  banks: BankItem[];
  removeButtonProps: ComponentProps<'button'>;
  canRemove: boolean;
};

// 1 行（口座 Select + 残高 Input + 行削除）。
function BalanceRow({
  bankIdField,
  priceField,
  banks,
  removeButtonProps,
  canRemove
}: BalanceRowProps) {
  const selectProps = getSelectProps(bankIdField);
  const priceProps = getInputProps(priceField, { type: 'text' });
  return (
    <div className='flex items-start gap-2'>
      <div className='flex w-2/5 flex-col gap-1'>
        <Label htmlFor={selectProps.id} className='sr-only'>
          {bankLabels.heading.bankName}
        </Label>
        <select {...selectProps} className={selectClassName}>
          <option value=''>{bankLabels.placeholder.selectBank}</option>
          {banks.map((bank) => (
            <option key={bank.id} value={bank.id}>
              {bank.name}
            </option>
          ))}
        </select>
        {bankIdField.errors ? (
          <p className='text-xs text-red-600' role='alert'>
            {bankIdField.errors.join(' / ')}
          </p>
        ) : null}
      </div>
      <div className='flex flex-1 flex-col gap-1'>
        <Label htmlFor={priceProps.id} className='sr-only'>
          {bankLabels.heading.balance}
        </Label>
        <Input
          {...priceProps}
          inputMode='numeric'
          placeholder={bankLabels.placeholder.balanceYen}
        />
        {priceField.errors ? (
          <p className='text-xs text-red-600' role='alert'>
            {priceField.errors.join(' / ')}
          </p>
        ) : null}
      </div>
      <Button
        type='button'
        size='icon-sm'
        variant='ghost'
        disabled={!canRemove}
        aria-label={bankLabels.action.removeRow}
        {...removeButtonProps}
      >
        ✕
      </Button>
    </div>
  );
}
