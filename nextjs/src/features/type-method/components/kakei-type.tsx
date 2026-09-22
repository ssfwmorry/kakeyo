'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ColorClassification } from '@/features/master';
import { L } from '@/lib/shared/labels';
import { swapSubTypeAction, swapTypeAction } from '../actions';
import { colorHex } from '../color';
import { typeMethodLabels } from '../labels';
import type { GroupedTypeList, SubTypeCard, TypeCard } from '../types';
import { SubTypeDialog } from './sub-type-dialog';
import { SwapButton } from './swap-button';
import { TypeDialog } from './type-dialog';

// カテゴリ設定タブ。支出/収入の切替、編集/並べ替えモード、カテゴリ・サブカテゴリの
// CRUD ダイアログを束ねる Client Component。データは server で取得済みを props で受ける
// （P5 の setting page が getTypeCardList の結果を渡す）。

type KakeiTypeProps = {
  typeList: GroupedTypeList;
  colors: ColorClassification[];
  // ペア共有モードか（個人 = false）。getPairMode 由来を server から受ける。
  isPair: boolean;
};

type TypeDialogState =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; card: TypeCard };

type SubTypeDialogState =
  | { kind: 'closed' }
  | { kind: 'create'; typeId: number }
  | { kind: 'edit'; typeId: number; card: SubTypeCard };

export function KakeiType({ typeList, colors, isPair }: KakeiTypeProps) {
  const [isPay, setIsPay] = useState(true);
  const [isEdit, setIsEdit] = useState(true);
  const [typeDialog, setTypeDialog] = useState<TypeDialogState>({
    kind: 'closed'
  });
  const [subDialog, setSubDialog] = useState<SubTypeDialogState>({
    kind: 'closed'
  });

  const bucket = isPay ? typeList.pay : typeList.income;
  const cards = isPair ? bucket.pair : bucket.self;
  // 編集対象を先に確定しておく（key によるリマウントと editing 受け渡しで共用）。
  const editingType = typeDialog.kind === 'edit' ? typeDialog.card : undefined;
  const editingSub = subDialog.kind === 'edit' ? subDialog.card : undefined;

  return (
    <section className='flex flex-col gap-3'>
      <div className='flex items-center gap-3'>
        <Tabs
          value={isPay ? 'pay' : 'income'}
          onValueChange={(value) => setIsPay(value === 'pay')}
        >
          <TabsList>
            <TabsTrigger value='pay'>
              {typeMethodLabels.typeTab.pay}
            </TabsTrigger>
            <TabsTrigger value='income'>
              {typeMethodLabels.typeTab.income}
            </TabsTrigger>
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

      {cards.map((card, index) => (
        <TypeCardView
          key={card.id}
          card={card}
          isEdit={isEdit}
          nextId={cards[index + 1]?.id}
          onEditType={() => setTypeDialog({ kind: 'edit', card })}
          onCreateSub={() => setSubDialog({ kind: 'create', typeId: card.id })}
          onEditSub={(sub) =>
            setSubDialog({ kind: 'edit', typeId: card.id, card: sub })
          }
        />
      ))}

      <div className='flex justify-end'>
        <Button type='button' onClick={() => setTypeDialog({ kind: 'create' })}>
          ＋
        </Button>
      </div>

      <TypeDialog
        // defaultValue をプリフィルさせるため編集対象ごとにリマウントする。
        key={String(editingType?.id)}
        open={typeDialog.kind !== 'closed'}
        onOpenChange={(open) =>
          open ? undefined : setTypeDialog({ kind: 'closed' })
        }
        colors={colors}
        isPay={isPay}
        isPair={isPair}
        editing={editingType}
      />
      {subDialog.kind !== 'closed' ? (
        <SubTypeDialog
          // defaultValue をプリフィルさせるため編集対象ごとにリマウントする。
          key={String(editingSub?.id)}
          open
          onOpenChange={(open) =>
            open ? undefined : setSubDialog({ kind: 'closed' })
          }
          typeId={subDialog.typeId}
          editing={editingSub}
        />
      ) : null}
    </section>
  );
}

type TypeCardViewProps = {
  card: TypeCard;
  isEdit: boolean;
  nextId?: number;
  onEditType: () => void;
  onCreateSub: () => void;
  onEditSub: (sub: SubTypeCard) => void;
};

function TypeCardView({
  card,
  isEdit,
  nextId,
  onEditType,
  onCreateSub,
  onEditSub
}: TypeCardViewProps) {
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
          <Button type='button' size='sm' variant='ghost' onClick={onEditType}>
            {L.button.edit}
          </Button>
        ) : nextId !== undefined ? (
          <SwapButton
            prevId={card.id}
            nextId={nextId}
            action={swapTypeAction}
            label={typeMethodLabels.swap.down}
            icon='↓'
          />
        ) : null}
      </CardHeader>
      <CardContent className='flex flex-col gap-1'>
        {card.subTypes.map((sub, index) => (
          <div key={sub.id} className='flex items-center justify-between'>
            <span className='text-sm'>{sub.name}</span>
            {isEdit ? (
              <Button
                type='button'
                size='sm'
                variant='ghost'
                onClick={() => onEditSub(sub)}
              >
                {L.button.edit}
              </Button>
            ) : card.subTypes[index + 1] ? (
              <SwapButton
                prevId={sub.id}
                nextId={card.subTypes[index + 1].id}
                action={swapSubTypeAction}
                label={typeMethodLabels.swap.next}
                icon='→'
              />
            ) : null}
          </div>
        ))}
        <div className='flex justify-end'>
          <Button
            type='button'
            size='sm'
            variant='secondary'
            onClick={onCreateSub}
          >
            ＋
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
