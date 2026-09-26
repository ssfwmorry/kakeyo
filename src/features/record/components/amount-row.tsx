'use client';

import { cn } from 'cn';
import { IconRotateCcw } from '@/components/icons';
import { formatSignedPrice } from '@/lib/shared/domain/format';

// テンキーの上の金額。左に「クリア」、右に大きな金額。支出は「−」で文字色、収入は「+」でアクセント。
// mt-auto を持ち、上の内容が短くてもテンキーごと下に張り付く。

export function AmountRow({
  isPay,
  price,
  label,
  onClear
}: {
  isPay: boolean;
  price: number;
  // output のアクセシブルネーム（「支出の金額」「毎月の金額」）。
  label: string;
  onClear: () => void;
}) {
  return (
    <div className='mt-auto flex h-14 shrink-0 items-center gap-2 px-1'>
      <button
        aria-label='金額を0にする'
        className='flex h-9 shrink-0 items-center gap-1.5 rounded-[18px] bg-muted py-0 pr-3.5 pl-[11px] font-semibold text-[13px] text-foreground'
        onClick={onClear}
        type='button'
      >
        <IconRotateCcw
          aria-hidden='true'
          className='size-[15px]'
          strokeWidth={2.4}
        />
        クリア
      </button>
      <output
        aria-label={label}
        className={cn(
          'flex min-w-0 flex-grow items-baseline justify-end gap-1.5 tabular-nums',
          isPay ? 'text-foreground' : 'text-primary'
        )}
      >
        <span className='whitespace-nowrap font-bold text-[44px] tracking-[-0.01em]'>
          {formatSignedPrice(price, isPay)}
        </span>
        <span className='font-semibold text-lg'>円</span>
      </output>
    </div>
  );
}
