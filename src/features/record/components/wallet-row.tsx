'use client';

import { IconCash } from '@/components/icons';
import { InfoPopover } from '@/components/ui/info-popover';
import { Segment } from '@/components/ui/segment';
import { recordLabels } from '@/features/record/labels';

// 共有の支出だけに出る「だれのお金で払ったか」。日付・メモと同じカードの 1 行に収める
// （見出し＋2 段のセグメントだと高さを取り、テンキーを押し出すため）。
//
// 立替かどうかで方法の候補が入れ替わるので、呼び出し側は onChange で方法の選択を捨てる。
// 「あとで精算する／しない」の意味は行に書き切れないので ⓘ の説明に置く。

const { wallet } = recordLabels;

const OPTIONS = [
  { value: 'instead', ...wallet.options.instead },
  { value: 'shared', ...wallet.options.shared }
] as const;

export function WalletRow({
  isInstead,
  onChange
}: {
  isInstead: boolean;
  onChange: (isInstead: boolean) => void;
}) {
  return (
    <div className='flex h-13 items-center gap-2.5 border-line-soft border-t pr-2 pl-3.5'>
      <IconCash
        aria-hidden='true'
        className='size-4.5 shrink-0 text-muted-foreground'
      />
      <span className='flex shrink-0 items-center gap-0.5'>
        <span className='text-[14px] text-muted-foreground'>
          {wallet.label}
        </span>
        <InfoPopover subject={wallet.label}>
          <dl className='flex flex-col gap-2'>
            {OPTIONS.map((option) => (
              <div key={option.value}>
                <dt className='font-bold'>{option.label}</dt>
                <dd className='text-muted-foreground'>{option.help}</dd>
              </div>
            ))}
          </dl>
        </InfoPopover>
      </span>
      <Segment
        className='ml-auto'
        fit
        label={wallet.label}
        onChange={(value) => onChange(value === 'instead')}
        options={OPTIONS}
        size='sm'
        tone='background'
        value={isInstead ? 'instead' : 'shared'}
      />
    </div>
  );
}
