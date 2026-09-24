'use client';

import { IconBackspace, IconClose } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  popDigit,
  pushDigit,
  pushDoubleZero
} from '@/lib/shared/domain/priceKeypad';

// 金額のテンキー入力（全金額フォーム共通）。OS 標準ソフトキーボードは使わず、
// 表示帯は readonly でテンキーのみから入力する。上限抑止は priceKeypad.ts（MAX_PRICE 未満）に内蔵。
//
// 値は親が文字列（Conform の hidden 送信値と揃える）で保持する。表示・操作のため
// number に変換し、変更を文字列で返す（'' は 0 として扱う）。
//
// 見出しラベルは置かない。金額であることは表示帯の「円」とテンキー自体が示しており、
// ラベル行は情報を足さずに縦を 28px 使うだけになる。note は背の低い端末で
// カテゴリ・方法・テンキーが縦に競合する画面なので、その 1 行を返す。
// 表示帯はテンキー操作の結果なので output 要素にし、aria-label で金額欄だと伝える。

type PriceKeypadProps = {
  // 表示帯の読み上げ名（画面には出さない）。
  label?: string;
  // '' は未入力=0 として扱う。
  value: string;
  onChange: (value: string) => void;
};

const DIGIT_ROWS = [
  [7, 8, 9],
  [4, 5, 6],
  [1, 2, 3]
];

function toNumber(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

export function PriceKeypad({
  label = '金額',
  value,
  onChange
}: PriceKeypadProps) {
  const current = toNumber(value);
  // 空文字は送らず未入力も '0' で返す（priceSchema が '' を必須エラーにするため）。
  // 送信可否は呼び出し側の canSubmit で担保する。
  const emit = (next: number) => onChange(String(next));

  return (
    <div className='flex flex-col gap-2'>
      <output
        aria-label={label}
        className='flex h-11 items-center justify-end gap-1 rounded-lg border border-input bg-transparent px-3'
      >
        {current !== 0 ? (
          <button
            type='button'
            aria-label='金額をクリア'
            className='mr-auto text-muted-foreground hover:text-foreground'
            onClick={() => emit(0)}
          >
            <IconClose className='size-4' />
          </button>
        ) : null}
        <span className='font-medium text-xl tabular-nums'>
          {current.toLocaleString()}
        </span>
        <span className='text-sm text-muted-foreground'>円</span>
      </output>

      <div className='grid grid-cols-3 gap-1.5'>
        {DIGIT_ROWS.flat().map((digit) => (
          <Button
            key={digit}
            type='button'
            variant='secondary'
            size='lg'
            className='h-12 text-lg'
            onClick={() => emit(pushDigit(current, digit))}
          >
            {digit}
          </Button>
        ))}
        <Button
          type='button'
          variant='secondary'
          size='lg'
          className='h-12 text-lg'
          onClick={() => emit(pushDoubleZero(current))}
        >
          00
        </Button>
        <Button
          type='button'
          variant='secondary'
          size='lg'
          className='h-12 text-lg'
          onClick={() => emit(pushDigit(current, 0))}
        >
          0
        </Button>
        <Button
          type='button'
          variant='secondary'
          size='lg'
          className='h-12'
          aria-label='一桁削除'
          onClick={() => emit(popDigit(current))}
        >
          <IconBackspace className='size-5' />
        </Button>
      </div>
    </div>
  );
}
