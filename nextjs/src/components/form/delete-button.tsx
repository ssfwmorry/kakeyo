'use client';

import { IconTrash } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { L } from '@/lib/shared/labels';
import type { FormActionResult } from '@/lib/shared/types/formResult';
import { ConfirmDialog } from './confirm-dialog';
import { useFormAction } from './use-form-action';

// 1 件削除の確認付きボタン（フォーム共通）。
//
// 削除は取り消せない一方、同じ画面の主操作（登録/変更）はやり直せる。この非対称さに
// 合わせて、見た目も主操作より弱くする（塗らない・全幅にしない）。
//
// Server Action は id 1 個の FormData を受け、成功時は redirect する前提
// （失敗時のみ toast が出る）。

type DeleteButtonProps = {
  id: number;
  action: (
    prev: FormActionResult | null,
    payload: FormData
  ) => Promise<FormActionResult>;
  // 確認ダイアログの本文（何が消えるかを具体的に書く）。
  description: string;
};

export function DeleteButton({ id, action, description }: DeleteButtonProps) {
  const [, dispatch, isPending] = useFormAction(action);

  const remove = () => {
    const formData = new FormData();
    formData.set('id', String(id));
    dispatch(formData);
  };

  return (
    <ConfirmDialog
      trigger={
        <Button
          type='button'
          variant='ghost'
          size='lg'
          disabled={isPending}
          className='self-center text-destructive hover:bg-destructive/10 hover:text-destructive'
        >
          <IconTrash aria-hidden />
          {L.button.delete}
        </Button>
      }
      title={L.button.delete}
      description={description}
      size='sm'
      solidConfirm
      onConfirm={remove}
    />
  );
}
