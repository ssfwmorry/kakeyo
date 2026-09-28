'use client';

import { MasterSheet } from '@/components/master-sheet';
import type { SubTypeCard } from '@/features/type-method';
import {
  deleteSubTypeAction,
  upsertSubTypeAction
} from '@/features/type-method/actions';
import { subTypeUpsertSchema } from '@/features/type-method/schemas';

// サブカテゴリの編集シート。名前だけを持ち、色はカテゴリ側に従う。

export function SubTypeSheet({
  isOpen,
  onOpenChange,
  typeId,
  subType
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  typeId: number;
  subType: SubTypeCard;
}) {
  return (
    <MasterSheet
      counter={false}
      deleteAction={deleteSubTypeAction}
      editing={subType}
      entity='サブカテゴリ'
      helper='名前を変えると、これまでの記録にも新しい名前で表示されます'
      hiddenFields={{ typeId: String(typeId) }}
      isOpen={isOpen}
      nameAriaLabel='サブカテゴリ名'
      nameHeight={48}
      onOpenChange={onOpenChange}
      upsertAction={upsertSubTypeAction}
      upsertSchema={subTypeUpsertSchema}
    />
  );
}
