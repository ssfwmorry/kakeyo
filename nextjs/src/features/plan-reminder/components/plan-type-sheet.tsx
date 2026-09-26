'use client';

import { MasterSheet } from '@/components/master-sheet';
import type { ColorClassification } from '@/features/master';
import type { PlanTypeCard } from '@/features/plan-reminder';
import {
  deletePlanTypeAction,
  upsertPlanTypeAction
} from '@/features/plan-reminder/actions';
import { planTypeUpsertSchema } from '@/features/plan-reminder/schemas';
import { quoted } from '@/lib/shared/domain/format';

// 予定カテゴリの追加・編集シート。名前と色だけのマスタなので方法・口座と同じ
// MasterSheet に載せる。使われているカテゴリの削除は原典どおりトーストで断る。

export function PlanTypeSheet({
  isOpen,
  onOpenChange,
  planType,
  colors,
  isPair
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  // 編集対象。追加のときは undefined。
  planType?: PlanTypeCard;
  colors: ColorClassification[];
  isPair: boolean;
}) {
  return (
    <MasterSheet
      colors={colors}
      deleteAction={deletePlanTypeAction}
      editing={planType}
      entity='予定カテゴリ'
      hiddenFields={{ isPair: String(isPair) }}
      isOpen={isOpen}
      nameAriaLabel='予定カテゴリの名前'
      namePlaceholder='例：通院'
      onForeignKey={{
        kind: 'toast',
        message: (name) =>
          `${quoted(name)}を使っている予定があるので削除できません`
      }}
      onOpenChange={onOpenChange}
      upsertAction={upsertPlanTypeAction}
      upsertSchema={planTypeUpsertSchema}
    />
  );
}
