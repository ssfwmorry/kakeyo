'use client';

import { useState } from 'react';
import { AddRow } from '@/components/add-row';
import { NameCell } from '@/components/name-cell';
import { ScreenHeader } from '@/components/screen-header';
import { ScreenLead, ScreenNote, ScreenTitle } from '@/components/screen-title';
import { SectionList } from '@/components/section-list';
import {
  SortableHandle,
  SortableList,
  useSortableOrder
} from '@/components/sortable-list';
import type { ColorClassification } from '@/features/master';
import type { PlanTypeCard } from '@/features/plan-reminder';
import { reorderPlanTypeAction } from '@/features/plan-reminder/actions';
import { PlanTypeSheet } from './plan-type-sheet';

// 設定 › 予定カテゴリ（原典 SetPlanType）。名前と色だけを持つので、方法と同じくシートで編集する。

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
  const [sheet, setSheet] = useState<SheetState>({ kind: 'closed' });
  const { ordered, reorder } = useSortableOrder(
    planTypes,
    reorderPlanTypeAction
  );

  return (
    <div className='flex flex-col'>
      <ScreenHeader backHref='/setting' backLabel='設定' />
      <div className='flex flex-col gap-3 px-3'>
        <ScreenTitle badge={isPair ? 'pair' : 'self'}>予定カテゴリ</ScreenTitle>
        <ScreenLead>
          予定を追加するときに選ぶカテゴリです。色はカレンダーの帯の色になります
        </ScreenLead>

        {ordered.length > 0 ? (
          <SectionList>
            <SortableList
              items={ordered}
              onReorder={reorder}
              renderItem={(card, { handleProps }) => (
                <NameCell
                  ariaLabel={`${card.name}を編集`}
                  colorName={card.colorName}
                  handle={<SortableHandle {...handleProps} />}
                  isFirst={card.id === ordered[0]?.id}
                  name={card.name}
                  onOpen={() => setSheet({ kind: 'edit', card })}
                />
              )}
            />
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

        <ScreenNote>
          行をタップすると名前と色を変えられます。≡
          をドラッグすると並べ替えられ、並びはすぐ保存されます。並び順は予定を追加するときの候補の並びになります。
        </ScreenNote>
      </div>

      {sheet.kind === 'closed' ? null : (
        <PlanTypeSheet
          colors={colors}
          isOpen
          isPair={isPair}
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
