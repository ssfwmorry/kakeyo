'use client';

import type { ComponentProps } from 'react';
import { Button } from '@/components/ui/button';

// 送信ボタン（フォーム共通）。処理中はスピナーを出し、押下を止める。
//
// 処理中の表示は全画面オーバーレイではなく局所フィードバックで行う。ただし disabled
// だけだと押しても無反応に見えるため、要所のボタンにスピナーを足す。

type SubmitButtonProps = ComponentProps<typeof Button> & {
  isPending: boolean;
};

export function SubmitButton({
  isPending,
  children,
  ...props
}: SubmitButtonProps) {
  return (
    <Button type='submit' disabled={isPending} {...props}>
      {isPending ? (
        <span
          aria-hidden
          className='size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent'
        />
      ) : null}
      {children}
    </Button>
  );
}
