import { cn } from 'cn';
import type { ComponentProps } from 'react';

// 新デザインの入力欄。ラベルを左に置いた 1 行の白い面（デザイン基礎の各シート）。
// 枠線は持たず、地との明度差だけで入力欄と分かる。

export function TextField({
  label,
  className,
  errors,
  errorId,
  ...props
}: {
  label: string;
  errors?: string[];
  errorId?: string;
} & ComponentProps<'input'>) {
  return (
    <div className='flex flex-col gap-1.5'>
      <label className='flex h-12 items-center gap-2.5 rounded-xl bg-card px-3.5'>
        <span className='shrink-0 text-[13px] text-muted-foreground'>
          {label}
        </span>
        <input
          className={cn(
            'min-w-0 flex-grow bg-transparent font-semibold text-[17px] text-foreground outline-none',
            className
          )}
          type='text'
          {...props}
        />
      </label>
      {errors ? (
        <p className='px-1 text-destructive text-sm' id={errorId} role='alert'>
          {errors.join(' / ')}
        </p>
      ) : null}
    </div>
  );
}
