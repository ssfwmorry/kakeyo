'use client';

import { useState } from 'react';
import { SwapButton } from '@/components/form/swap-button';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import type { ColorClassification } from '@/features/master';
import { colorHex } from '@/features/master';
import { L } from '@/lib/shared/labels';
import { swapPlanTypeAction } from '../actions';
import { planReminderLabels } from '../labels';
import type { GroupedPlanTypeList, PlanTypeCard } from '../types';
import { PlanTypeDialog } from './plan-type-dialog';

// 予定カテゴリ設定タブ（Nuxt PlanType.vue 移植）。編集/並べ替えモードを切替え、
// カテゴリの CRUD ダイアログと並べ替えボタンを束ねる Client Component。
// データは server で取得済みを props で受ける（setting 統合 page が渡す）。
// isPair は setting 側のペアモードで振り分け済みのリストを渡す前提だが、
// 表示のため self/pair 両方を持つ list を受け取り、ここで振り分ける。

type PlanTypeTabProps = {
  planTypeList: GroupedPlanTypeList;
  colors: ColorClassification[];
  // ペア共有モードか（個人 = false）。getPairMode 由来を server から受ける。
  isPair: boolean;
};

type DialogState =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; card: PlanTypeCard };

export function PlanTypeTab({
  planTypeList,
  colors,
  isPair
}: PlanTypeTabProps) {
  const [isEdit, setIsEdit] = useState(true);
  const [dialog, setDialog] = useState<DialogState>({ kind: 'closed' });

  const cards = isPair ? planTypeList.pair : planTypeList.self;

  return (
    <section className='flex flex-col gap-3'>
      <div className='flex items-center justify-between'>
        <h2 className='text-base font-medium'>
          {planReminderLabels.heading.planType}
        </h2>
        <Button
          type='button'
          size='sm'
          variant='outline'
          onClick={() => setIsEdit((prev) => !prev)}
        >
          {isEdit ? L.button.sort : L.button.edit}
        </Button>
      </div>

      {cards.map((card, index) => (
        <PlanTypeCardView
          key={card.id}
          card={card}
          isEdit={isEdit}
          nextId={cards[index + 1]?.id}
          onEdit={() => setDialog({ kind: 'edit', card })}
        />
      ))}

      <div className='flex justify-end'>
        <Button type='button' onClick={() => setDialog({ kind: 'create' })}>
          ＋
        </Button>
      </div>

      <PlanTypeDialog
        // defaultValue をプリフィルさせるため編集対象ごとにリマウントする。
        key={dialog.kind === 'edit' ? dialog.card.id : 'new'}
        open={dialog.kind !== 'closed'}
        onOpenChange={(open) =>
          open ? undefined : setDialog({ kind: 'closed' })
        }
        colors={colors}
        isPair={isPair}
        editing={dialog.kind === 'edit' ? dialog.card : undefined}
      />
    </section>
  );
}

type PlanTypeCardViewProps = {
  card: PlanTypeCard;
  isEdit: boolean;
  nextId?: number;
  onEdit: () => void;
};

function PlanTypeCardView({
  card,
  isEdit,
  nextId,
  onEdit
}: PlanTypeCardViewProps) {
  return (
    <Card>
      <CardHeader className='flex-row items-center justify-between gap-2'>
        <span className='flex items-center gap-2'>
          <span
            className='inline-block size-5 rounded-full'
            style={{ backgroundColor: colorHex(card.colorName) }}
          />
          {card.name}
        </span>
        {isEdit ? (
          <Button type='button' size='sm' variant='ghost' onClick={onEdit}>
            {L.button.edit}
          </Button>
        ) : nextId !== undefined ? (
          <SwapButton
            prevId={card.id}
            nextId={nextId}
            action={swapPlanTypeAction}
            label={planReminderLabels.swap.down}
            icon='↓'
          />
        ) : null}
      </CardHeader>
    </Card>
  );
}
