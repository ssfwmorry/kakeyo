'use client';

import { useState } from 'react';
import { AddButton } from '@/components/form/add-button';
import { SwapButton } from '@/components/form/swap-button';
import { IconArrowDown, IconPencil, IconShape } from '@/components/icons';
import { SectionHeading } from '@/components/section-heading';
import { ShareBadge } from '@/components/share-badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import type { ColorClassification } from '@/features/master';
import { colorHex } from '@/features/master';
import { addLabel, L } from '@/lib/shared/labels';
import { swapPlanTypeAction } from '../actions';
import { planReminderLabels } from '../labels';
import type { GroupedPlanTypeList, PlanTypeCard } from '../types';
import { PlanTypeDialog } from './plan-type-dialog';

// self/pair 両方を持つ list を受け取り、isPair でここで振り分けて表示する。

type PlanTypeTabProps = {
  planTypeList: GroupedPlanTypeList;
  colors: ColorClassification[];
  // ペア共有モードか（個人 = false）。
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
        <SectionHeading icon={IconShape}>
          {planReminderLabels.heading.planType}
        </SectionHeading>
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

      <AddButton
        label={addLabel(planReminderLabels.dialogEntity.planType)}
        onClick={() => setDialog({ kind: 'create' })}
      />

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
      <CardHeader layout='row'>
        <span className='flex items-center gap-2'>
          <ShareBadge
            colorHex={colorHex(card.colorName)}
            isPair={card.isPair}
            shape='square'
          />
          {card.name}
        </span>
        {isEdit ? (
          <Button
            type='button'
            size='icon'
            variant='ghost'
            aria-label={L.button.edit}
            onClick={onEdit}
          >
            <IconPencil className='size-4' />
          </Button>
        ) : nextId !== undefined ? (
          <SwapButton
            prevId={card.id}
            nextId={nextId}
            action={swapPlanTypeAction}
            label={planReminderLabels.swap.down}
            icon={<IconArrowDown className='size-4' />}
          />
        ) : null}
      </CardHeader>
    </Card>
  );
}
