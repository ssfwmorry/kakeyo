'use client';

import { Button } from '@/components/ui/button';
import type { MethodCard } from '@/features/type-method';

// 支払方法の選択行（note の記録・定期入力が共有する）。
//
// 方法は候補が数件なので、プルダウンを開かせず横並びのピルで直接選ばせる。
// カテゴリ（色丸グリッド）と同格に見せないため、色も丸も持たせず名前だけの一列にする。
// 折り返さず横スクロールにするのは、件数が増えても縦の占有を 1 行に保ち
// カテゴリより従であるという階層を維持するため。fieldset は UA スタイルで
// min-width:min-content を持ち、そのままだと中身の幅まで広がって子の
// overflow-x-auto が効かないため min-w-0 で縮められるようにする。

export function MethodRow({
  methods,
  methodId,
  label,
  insteadLabel,
  emptyMessage,
  showInstead,
  isInstead,
  onMethodChange,
  onInsteadChange
}: {
  methods: MethodCard[];
  methodId: number | null;
  label: string;
  insteadLabel: string;
  // 収支・立替の組み合わせに使える方法が 1 件もないときの案内。
  emptyMessage: string;
  showInstead: boolean;
  isInstead: boolean;
  onMethodChange: (methodId: number) => void;
  onInsteadChange: (isInstead: boolean) => void;
}) {
  return (
    <fieldset className='flex min-w-0 flex-col gap-2'>
      <div className='flex items-center justify-between gap-4'>
        <legend className='float-left text-sm font-medium'>{label}</legend>
        {showInstead ? (
          <label className='flex items-center gap-2 text-sm'>
            <input
              type='checkbox'
              checked={isInstead}
              onChange={(event) => onInsteadChange(event.target.checked)}
            />
            {insteadLabel}
          </label>
        ) : null}
      </div>
      {methods.length === 0 ? (
        <p className='text-sm text-muted-foreground'>{emptyMessage}</p>
      ) : (
        <div className='-mx-4 flex min-w-0 gap-2 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
          {methods.map((method) => {
            const isSelected = method.id === methodId;
            return (
              <Button
                key={method.id}
                type='button'
                variant={isSelected ? 'default' : 'outline'}
                size='lg'
                aria-pressed={isSelected}
                onClick={() => onMethodChange(method.id)}
              >
                {method.name}
              </Button>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}
