'use client';

import type { TypeCard } from '@/features/type-method';
import { InitialCircle } from '@/v2/components/initial-circle';
import { ListCellButton } from '@/v2/components/list-cell';
import { Button } from '@/v2/components/ui/button';
import { SheetHeader } from './sheet-header';

// 記録シート 2 枚目: サブカテゴリを選ぶ（デザイン NoteSub）。
//
// デザインではカテゴリの上に重なるシートだが、シートの上にシートを重ねないため
// 同じシートの中で画面を切り替える。「‹ カテゴリ」で 1 枚目へ戻る。
// サブカテゴリは従なので「サブカテゴリなしで進む」で飛ばせる（旧画面は必須選択だった）。

export function SubTypeStep({
  type,
  onBack,
  onPick
}: {
  type: TypeCard;
  onBack: () => void;
  // null は「サブカテゴリなしで進む」。
  onPick: (subTypeId: number | null) => void;
}) {
  return (
    <div className='flex flex-col gap-3'>
      <SheetHeader
        back={{ label: 'カテゴリ', onClick: onBack }}
        title={
          <span className='flex items-center gap-2'>
            <InitialCircle colorName={type.colorName} name={type.name} />
            <span className='font-semibold text-[17px]'>{type.name}</span>
          </span>
        }
      />

      <div className='overflow-hidden rounded-2xl bg-card'>
        {type.subTypes.map((sub, index) => (
          <ListCellButton
            height={52}
            isFirst={index === 0}
            key={sub.id}
            label={sub.name}
            onClick={() => onPick(sub.id)}
          />
        ))}
      </div>

      <Button onClick={() => onPick(null)} size='sm' variant='ghost'>
        サブカテゴリなしで進む
      </Button>
    </div>
  );
}
