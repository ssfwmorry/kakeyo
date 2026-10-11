'use client';

import { cn } from 'cn';
import type { ComponentProps } from 'react';
import { Spinner } from '@/components/ui/spinner';

// シート末尾の主ボタン。「追加する」「保存する」「登録する」など、そのシートの
// 唯一の主操作を h52 のアクセント塗りで出す（共通仕様「ボトムシート」）。
//
// 押せないときは灰色にして、押せない理由（「名前を入れると追加できます」）を
// ボタンの文字にする。活性の判定は呼び出し側がクライアント状態で行い、
// 必須エラーを別に出さない。
//
// 処理中（isPending）は塗りと文言をそのままにスピナーを添え、押下だけ止める。
// disabled に畳むと灰色になって「◯◯を入れると…」の理由が出てしまい、入力済みなのに
// 足りないように読めるため、押せない理由と処理中は別の状態として扱う。
//
// bar を付けると、全高固定のシートで下端に張り付く保存バー（地色の帯）に包む。
// 余った高さを吸うのは上の金額行（mt-auto）に任せ、帯は上下とも固定の余白だけ持つ。
// 下はホームインジケータと指の届く範囲を空ける床。env が 0 になる端末でもここは詰めない。

export function SheetSubmitButton({
  label,
  disabledLabel,
  disabled = false,
  isPending = false,
  bar = false,
  className,
  ...props
}: {
  label: string;
  // disabled のときに代わりに出す文言。
  disabledLabel?: string;
  isPending?: boolean;
  bar?: boolean;
} & Omit<ComponentProps<'button'>, 'children'>) {
  const button = (
    <button
      className={cn(
        'inline-flex h-13 w-full shrink-0 items-center justify-center gap-2 rounded-xl',
        disabled
          ? 'bg-disabled font-semibold text-[15px] text-muted-foreground'
          : 'bg-primary font-bold text-[17px] text-primary-foreground',
        className
      )}
      disabled={disabled || isPending}
      type='submit'
      {...props}
    >
      {isPending ? <Spinner className='size-4.5' /> : null}
      {disabled && disabledLabel !== undefined ? disabledLabel : label}
    </button>
  );
  if (!bar) {
    return button;
  }
  return (
    <div
      className='-mx-4 shrink-0 bg-background px-4 pt-1.5'
      style={{
        paddingBottom: 'max(calc(env(safe-area-inset-bottom) + 10px), 34px)'
      }}
    >
      {button}
    </div>
  );
}
