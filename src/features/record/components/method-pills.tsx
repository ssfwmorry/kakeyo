'use client';

import { cn } from 'cn';
import { IconCreditCard } from '@/components/icons';
import { recordLabels } from '@/features/record/labels';
import type { MethodCard } from '@/features/type-method';
import type { Id } from '@/lib/shared/types/id';

// 方法の候補を並べたピル。選択中はアクセントで塗る。集計画面のフィルタのピルと同じ寸法。
// 候補は折り返して全件見せ、数が多くても下の金額・テンキーを押し出さないよう高さを
// 2.5 行相当で頭打ちにして縦スクロールする。半端な行を見せるのは、続きがあると気付かせるため。

export function MethodPills({
  methods,
  methodId,
  onChange
}: {
  methods: MethodCard[];
  methodId: Id | null;
  onChange: (methodId: Id) => void;
}) {
  if (methods.length === 0) {
    return (
      <p className='px-1 text-muted-foreground text-sm'>
        {recordLabels.empty.noMethod}
      </p>
    );
  }
  return (
    <div className='flex max-h-[84px] min-w-0 flex-grow flex-wrap gap-1.5 overflow-y-auto'>
      {methods.map((method) => {
        const isSelected = method.id === methodId;
        return (
          <button
            aria-pressed={isSelected}
            className={cn(
              'flex h-[30px] shrink-0 items-center whitespace-nowrap rounded-full px-3 font-semibold text-[13px]',
              isSelected
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-foreground'
            )}
            key={method.id}
            onClick={() => onChange(method.id)}
            type='button'
          >
            {method.name}
          </button>
        );
      })}
    </div>
  );
}

// 方法の候補。見出しの 1 行は縦の余裕を奪うので、代わりにピルの先頭へカードのアイコンを
// 添えて何の並びかを示す。
export function MethodField({
  isPay,
  methods,
  methodId,
  onChange
}: {
  isPay: boolean;
  methods: MethodCard[];
  methodId: Id | null;
  onChange: (methodId: Id) => void;
}) {
  return (
    <fieldset
      aria-label={isPay ? '支払方法' : '受取方法'}
      className='flex shrink-0 items-start gap-2'
    >
      <IconCreditCard
        aria-hidden='true'
        className='mt-[7px] size-4.5 shrink-0 text-muted-foreground'
      />
      <MethodPills methodId={methodId} methods={methods} onChange={onChange} />
    </fieldset>
  );
}
