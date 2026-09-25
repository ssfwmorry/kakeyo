'use client';

import { useState } from 'react';
import { SwapButton } from '@/components/form/swap-button';
import { IconArrowDown } from '@/components/icons';
import type { ColorClassification } from '@/features/master';
import type { PlanTypeCard } from '@/features/plan-reminder';
import { swapPlanTypeAction } from '@/features/plan-reminder/actions';
import { AddRow } from '@/v2/components/add-row';
import { NameCell } from '@/v2/components/name-cell';
import { ScreenHeader } from '@/v2/components/screen-header';
import { ScreenTitle } from '@/v2/components/screen-title';
import { SectionList } from '@/v2/components/section-list';
import { PlanTypeSheet } from './plan-type-sheet';

// 設定 › 予定カテゴリ（新デザイン）。名前と色だけを持つので、方法と同じくシートで編集する。
//
// 並べ替えはデザインではドラッグハンドルだが、既存の swap（下と入れ替え）を使う。

type SheetState =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; card: PlanTypeCard };

export function PlanTypeScreen({
  planTypes,
  colors,
  isPair
}: {
  planTypes: PlanTypeCard[];
  colors: ColorClassification[];
  isPair: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [sheet, setSheet] = useState<SheetState>({ kind: 'closed' });

  return (
    <div className='flex flex-col pb-6'>
      <ScreenHeader
        action={
          <button
            className='h-11 px-2 font-semibold text-base text-primary'
            onClick={() => setIsEditing((prev) => !prev)}
            type='button'
          >
            {isEditing ? '完了' : '編集'}
          </button>
        }
        backHref='/v2/setting'
        backLabel='設定'
      />
      <div className='flex flex-col gap-3 px-4'>
        <ScreenTitle badge={isPair ? '共有の設定' : '個人の設定'}>
          予定カテゴリ
        </ScreenTitle>

        {planTypes.length > 0 ? (
          <SectionList>
            {planTypes.map((card, index) => (
              <NameCell
                colorName={card.colorName}
                isEditing={isEditing}
                isFirst={index === 0}
                key={card.id}
                name={card.name}
                onOpen={() => setSheet({ kind: 'edit', card })}
                swap={
                  planTypes[index + 1] === undefined ? undefined : (
                    <SwapButton
                      action={swapPlanTypeAction}
                      icon={<IconArrowDown className='size-4' />}
                      label='下と入れ替え'
                      nextId={planTypes[index + 1].id}
                      prevId={card.id}
                    />
                  )
                }
              />
            ))}
          </SectionList>
        ) : (
          <p className='px-1 text-muted-foreground text-sm'>
            予定カテゴリはまだありません。
          </p>
        )}

        <AddRow
          label='予定カテゴリを追加'
          onClick={() => setSheet({ kind: 'create' })}
        />

        <p className='px-1 text-muted-foreground text-xs leading-relaxed'>
          「編集」で並べ替え。並び順は予定を追加するときの候補の並びに
          そのまま使われます。
        </p>
      </div>

      {sheet.kind === 'closed' ? null : (
        <PlanTypeSheet
          colors={colors}
          isOpen
          isPair={isPair}
          // 編集対象ごとにフォームを作り直す（useForm の defaultValue は
          // マウント時にしか取り込まれないため）。
          key={sheet.kind === 'edit' ? sheet.card.id : 'create'}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setSheet({ kind: 'closed' });
            }
          }}
          planType={sheet.kind === 'edit' ? sheet.card : undefined}
        />
      )}
    </div>
  );
}
