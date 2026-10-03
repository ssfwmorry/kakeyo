'use client';

import { cn } from 'cn';
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
    <div className='-mx-4 flex max-h-[87px] flex-wrap gap-1.5 overflow-y-auto px-4'>
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

// 見出し付きの方法の候補。
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
    <div className='flex shrink-0 flex-col gap-1.5'>
      <FieldLabel>{isPay ? '支払方法' : '受取方法'}</FieldLabel>
      <MethodPills methodId={methodId} methods={methods} onChange={onChange} />
    </div>
  );
}

// 方法などの見出し。12px の補足色。
export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className='font-semibold text-[12px] text-muted-foreground'>
      {children}
    </span>
  );
}
