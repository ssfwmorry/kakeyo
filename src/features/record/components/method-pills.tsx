'use client';

import { cn } from 'cn';
import { recordLabels } from '@/features/record/labels';
import type { MethodCard } from '@/features/type-method';
import type { Id } from '@/lib/shared/types/id';

// 方法の候補を横に並べたピル。選択中はアクセントで塗る。候補が画面幅を超えたら横にスクロールする。

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
    <div className='-mx-4 flex gap-2 overflow-x-auto px-4'>
      {methods.map((method) => {
        const isSelected = method.id === methodId;
        return (
          <button
            aria-pressed={isSelected}
            className={cn(
              'flex h-9 shrink-0 items-center whitespace-nowrap rounded-full px-3.5 font-semibold text-[14px]',
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

// 方法などの見出し。12px の補足色。
export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className='font-semibold text-[12px] text-muted-foreground'>
      {children}
    </span>
  );
}
