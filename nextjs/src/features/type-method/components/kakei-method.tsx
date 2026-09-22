'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ColorClassification } from '@/features/master';
import { L } from '@/lib/shared/labels';
import { swapMethodAction } from '../actions';
import { colorHex } from '../color';
import { typeMethodLabels } from '../labels';
import type { GroupedMethodList, MethodCard } from '../types';
import { MethodDialog, type PayMode } from './method-dialog';
import { SwapButton } from './swap-button';

// 方法設定タブ。支払/受取/精算の切替、編集/並べ替えモード、方法の CRUD を束ねる。
// 精算（both）はペア共有モード時のみ選択可（self は常に空）。

type KakeiMethodProps = {
  methodList: GroupedMethodList;
  colors: ColorClassification[];
  isPair: boolean;
};

type MethodDialogState =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; card: MethodCard };

export function KakeiMethod({ methodList, colors, isPair }: KakeiMethodProps) {
  const [payMode, setPayMode] = useState<PayMode>('pay');
  const [isEdit, setIsEdit] = useState(true);
  const [dialog, setDialog] = useState<MethodDialogState>({ kind: 'closed' });

  const bucket = methodList[payMode];
  const cards = isPair ? bucket.pair : bucket.self;

  return (
    <section className='flex flex-col gap-3'>
      <div className='flex items-center gap-3'>
        <Tabs
          value={payMode}
          onValueChange={(value) => setPayMode(value as PayMode)}
        >
          <TabsList>
            <TabsTrigger value='pay'>
              {typeMethodLabels.methodTab.pay}
            </TabsTrigger>
            <TabsTrigger value='income'>
              {typeMethodLabels.methodTab.income}
            </TabsTrigger>
            {isPair ? (
              <TabsTrigger value='both'>
                {typeMethodLabels.methodTab.both}
              </TabsTrigger>
            ) : null}
          </TabsList>
        </Tabs>
        <Button
          type='button'
          size='sm'
          variant='outline'
          onClick={() => setIsEdit((prev) => !prev)}
        >
          {isEdit ? L.button.sort : L.button.edit}
        </Button>
      </div>

      <div className='grid grid-cols-2 gap-2'>
        {cards.map((card, index) => (
          <MethodCardView
            key={card.id}
            card={card}
            isEdit={isEdit}
            nextId={cards[index + 1]?.id}
            onEdit={() => setDialog({ kind: 'edit', card })}
          />
        ))}
      </div>

      <div className='flex justify-end'>
        <Button
          type='button'
          disabled={payMode === 'both' && !isPair}
          onClick={() => setDialog({ kind: 'create' })}
        >
          ＋
        </Button>
      </div>

      <MethodDialog
        open={dialog.kind !== 'closed'}
        onOpenChange={(open) =>
          open ? undefined : setDialog({ kind: 'closed' })
        }
        colors={colors}
        payMode={payMode}
        isPair={isPair}
        editing={dialog.kind === 'edit' ? dialog.card : undefined}
      />
    </section>
  );
}

type MethodCardViewProps = {
  card: MethodCard;
  isEdit: boolean;
  nextId?: number;
  onEdit: () => void;
};

function MethodCardView({ card, isEdit, nextId, onEdit }: MethodCardViewProps) {
  return (
    <Card>
      <CardContent className='flex items-center justify-between gap-2 p-3'>
        <span style={{ color: colorHex(card.colorName) }}>{card.name}</span>
        {isEdit ? (
          <Button type='button' size='sm' variant='ghost' onClick={onEdit}>
            {L.button.edit}
          </Button>
        ) : nextId !== undefined ? (
          <SwapButton
            prevId={card.id}
            nextId={nextId}
            action={swapMethodAction}
            label={typeMethodLabels.swap.next}
            icon='→'
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
