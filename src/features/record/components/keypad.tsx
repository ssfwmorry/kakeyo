'use client';

import { IconBackspace } from '@/components/icons';
import {
  popDigit,
  pushDigit,
  pushDoubleZero
} from '@/lib/shared/domain/priceKeypad';

// 金額のテンキー（デザイン Note）。押下ロジックは priceKeypad に任せ、ここは見た目
// （白いキー・角丸 12・消すキーは面（弱））だけを持つ。
//
// 表示帯は持たない。金額の見せ方は画面ごとに違う（支出は黒、収入はアクセント）ので
// 呼び出し側が組む。

const DIGITS = [7, 8, 9, 4, 5, 6, 1, 2, 3] as const;

const KEY_CLASS =
  'h-12.5 rounded-xl font-medium text-[23px] text-foreground tabular-nums';

export function Keypad({
  value,
  onChange
}: {
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className='grid grid-cols-3 gap-1.5'>
      {DIGITS.map((digit) => (
        <button
          className={`${KEY_CLASS} bg-card`}
          key={digit}
          onClick={() => onChange(pushDigit(value, digit))}
          type='button'
        >
          {digit}
        </button>
      ))}
      <button
        className={`${KEY_CLASS} bg-card`}
        onClick={() => onChange(pushDoubleZero(value))}
        type='button'
      >
        00
      </button>
      <button
        className={`${KEY_CLASS} bg-card`}
        onClick={() => onChange(pushDigit(value, 0))}
        type='button'
      >
        0
      </button>
      <button
        aria-label='1桁消す'
        className={`${KEY_CLASS} flex items-center justify-center bg-muted`}
        onClick={() => onChange(popDigit(value))}
        type='button'
      >
        <IconBackspace aria-hidden='true' className='size-6' />
      </button>
    </div>
  );
}
