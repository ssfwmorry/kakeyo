'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useCloseOnSuccess } from '@/components/form/use-close-on-success';
import { useFormAction } from '@/components/form/use-form-action';
import { useSubmissionErrorToast } from '@/components/form/use-submission-error-toast';
import { IconShare } from '@/components/icons';
import { SheetHeader } from '@/components/sheet-header';
import { BottomSheet, BottomSheetContent } from '@/components/ui/bottom-sheet';
import { SheetSubmitButton } from '@/components/ui/sheet-submit-button';
import { Switch } from '@/components/ui/switch';
import { insertMemoAction } from '@/features/memo/actions';

// TODO の追加シート（原典 Calendar の「TODOを追加」）。
//
// やることの 1 行と「ペアと共有する」のスイッチだけ。ペア未設定なら共有の行を出さない
// （共有 TODO を作れないため）。追加が通ったら閉じ、一覧は再検証で更新される。

export function TodoSheet({
  hasPair,
  onOpenChange
}: {
  hasPair: boolean;
  onOpenChange: (isOpen: boolean) => void;
}) {
  const [result, action, isPending] = useFormAction(insertMemoAction);
  useCloseOnSuccess(result, onOpenChange);
  useSubmissionErrorToast(result);

  const [memo, setMemo] = useState('');
  const shareLabelId = useId();
  const canAdd = memo.trim() !== '';

  // 開いたら即入力できるようにフォーカスする。
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <BottomSheet onOpenChange={onOpenChange} open>
      <BottomSheetContent aria-label='TODOを追加'>
        <SheetHeader
          left='close'
          onLeft={() => onOpenChange(false)}
          title='TODOを追加'
        />

        <form action={action} className='flex flex-col gap-3.5'>
          <div className='overflow-hidden rounded-[14px] bg-card'>
            <label className='flex h-13 items-center px-3.5'>
              <input
                aria-label='やること'
                className='h-11 min-w-0 flex-grow bg-transparent text-base text-foreground outline-none'
                maxLength={30}
                name='memo'
                onChange={(event) => setMemo(event.target.value)}
                placeholder='やることを入力'
                ref={inputRef}
                type='text'
                value={memo}
              />
            </label>
            {hasPair ? (
              <div className='flex h-15 items-center gap-3 border-line-soft border-t px-3.5'>
                <IconShare
                  aria-hidden='true'
                  className='size-4.5 shrink-0 text-muted-foreground'
                  strokeWidth={2}
                />
                <span className='flex flex-grow flex-col gap-0.5'>
                  <span className='text-[15px]' id={shareLabelId}>
                    ペアと共有する
                  </span>
                  <span className='text-muted-foreground text-xs'>
                    オンにすると、ペアのTODOにも表示されます
                  </span>
                </span>
                <Switch
                  aria-labelledby={shareLabelId}
                  name='isPair'
                  value='on'
                />
              </div>
            ) : null}
          </div>

          <SheetSubmitButton
            disabled={!canAdd || isPending}
            disabledLabel='やることを入れると追加できます'
            label='追加する'
          />
        </form>
      </BottomSheetContent>
    </BottomSheet>
  );
}
