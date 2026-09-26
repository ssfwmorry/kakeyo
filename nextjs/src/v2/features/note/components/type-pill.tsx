'use client';

import { cn } from 'cn';
import { colorVar } from '@/features/master';
import { recordLabels } from '@/features/record/labels';
import type { TypeCard } from '@/features/type-method';
import type { Id } from '@/lib/shared/types/id';

// 選んだカテゴリの丸いピル（入力②・記録の編集・定期の記録の詳細のヘッダー中央）。
// 押すとカテゴリの選び直しへ戻る。

// 「食費 › スーパー」。サブカテゴリが無ければカテゴリだけ。
export function typeLabel(
  selectedType: TypeCard,
  subTypeId: Id | null
): string {
  const sub = selectedType.subTypes.find((item) => item.id === subTypeId);
  return sub === undefined
    ? selectedType.name
    : `${selectedType.name} › ${sub.name}`;
}

export function TypePill({
  isPay,
  isPair,
  selectedType,
  subTypeId,
  onClick
}: {
  isPay: boolean;
  isPair: boolean;
  selectedType: TypeCard;
  subTypeId: Id | null;
  onClick: () => void;
}) {
  return (
    <button
      aria-label='カテゴリを変える'
      className='flex h-9 max-w-full items-center gap-2 rounded-full bg-card px-3.5 text-foreground'
      onClick={onClick}
      type='button'
    >
      <span
        aria-hidden='true'
        className='size-2.5 shrink-0 rounded-full'
        style={{ backgroundColor: colorVar(selectedType.colorName) }}
      />
      <span className='truncate font-semibold text-[15px]'>
        {typeLabel(selectedType, subTypeId)}
      </span>
      <Badge isAccent={!isPay}>
        {isPay ? recordLabels.payToggle.pay : recordLabels.payToggle.income}
      </Badge>
      {isPair ? <Badge isAccent>共有</Badge> : null}
    </button>
  );
}

function Badge({
  isAccent,
  children
}: {
  isAccent: boolean;
  children: string;
}) {
  return (
    <span
      className={cn(
        'flex h-5 shrink-0 items-center rounded-md px-1.5 font-bold text-[11px]',
        isAccent ? 'bg-secondary text-primary' : 'bg-muted text-foreground'
      )}
    >
      {children}
    </span>
  );
}
