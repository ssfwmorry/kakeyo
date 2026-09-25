'use client';

import type { ColorClassification } from '@/features/master';
import type { MethodCard } from '@/features/type-method';
import {
  deleteMethodAction,
  upsertMethodAction
} from '@/features/type-method/actions';
import { methodUpsertSchema } from '@/features/type-method/schemas';
import { MasterSheet } from '@/v2/components/master-sheet';
import { quoted } from '@/v2/lib/format';
import type { PayMode } from './pay-mode';

// 方法の追加・編集シート。名前と色だけのマスタなので、口座と同じ MasterSheet に載せる。
// 記録に使われている方法は消せないので、削除は「削除できません」のアラートで説明する。

export function MethodSheet({
  isOpen,
  onOpenChange,
  method,
  payMode,
  entityName,
  placeholder,
  colors,
  isPair
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  // 編集対象。追加のときは undefined。
  method?: MethodCard;
  payMode: PayMode;
  // 「支払方法」「受取方法」「精算方法」。見出しと削除の文言に使う。
  entityName: string;
  placeholder: string;
  colors: ColorClassification[];
  isPair: boolean;
}) {
  return (
    <MasterSheet
      colors={colors}
      deleteAction={deleteMethodAction}
      editing={method}
      entity={entityName}
      hiddenFields={{ payMode, isPair: String(isPair) }}
      isOpen={isOpen}
      namePlaceholder={placeholder}
      onForeignKey={{
        kind: 'alert',
        description: (name) =>
          `${quoted(name)}には記録があります。名前と色の変更はできます。`
      }}
      onOpenChange={onOpenChange}
      upsertAction={upsertMethodAction}
      upsertSchema={methodUpsertSchema}
    />
  );
}
