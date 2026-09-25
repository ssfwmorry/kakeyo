'use client';

import type { TypeCard } from '@/features/type-method';
import { InitialCircle } from '@/v2/components/initial-circle';
import { ListCellButton } from '@/v2/components/list-cell';
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetTitle
} from '@/v2/components/ui/bottom-sheet';
import { Button } from '@/v2/components/ui/button';

// カテゴリを押したあとのサブカテゴリ選択（デザイン NoteType のシート）。
//
// 旧画面はサブカテゴリがあると必ず選ばせたが、新デザインは「サブカテゴリなしで進む」を持つ。
// サブカテゴリは従なので、急いでいるときは飛ばせてよい。

export function SubTypePickSheet({
  type,
  onOpenChange,
  onPick
}: {
  type: TypeCard;
  onOpenChange: (isOpen: boolean) => void;
  // null は「サブカテゴリなしで進む」。
  onPick: (subTypeId: number | null) => void;
}) {
  return (
    <BottomSheet onOpenChange={onOpenChange} open>
      <BottomSheetContent>
        <div className='flex h-10 items-center gap-2.5'>
          <InitialCircle colorName={type.colorName} name={type.name} />
          <BottomSheetTitle className='text-[17px]'>
            {type.name}
          </BottomSheetTitle>
        </div>

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
      </BottomSheetContent>
    </BottomSheet>
  );
}
