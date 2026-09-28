'use client';

import { useState } from 'react';
import { AddRow } from '@/components/add-row';
import { NameCell } from '@/components/name-cell';
import { ScreenHeader, ScreenHeaderAction } from '@/components/screen-header';
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
import { dismissToast } from '@/lib/shared/toast/show-toast';
import { PlanTypeSheet } from './plan-type-sheet';

// 設定 › 予定カテゴリ（原典 SetPlanType）。名前と色だけを持つので、方法と同じくシートで編集する。
//
// 「編集」中は並べ替えだけ（行頭の − は無く、行タップも追加行も無い）。削除はシートの
// ゴミ箱から行う。

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
  const { ordered, reorder } = useSortableOrder(
    planTypes,
    reorderPlanTypeAction
  );

  // 編集モードの出入りで、開いていたシートと残っていたトーストを片付ける。
  const toggleEditing = () => {
    setIsEditing((prev) => !prev);
    setSheet({ kind: 'closed' });
    dismissToast();
  };

  return (
    <div className='flex flex-col'>
      <ScreenHeader
        action={
          <ScreenHeaderAction onClick={toggleEditing}>
            {isEditing ? '完了' : '編集'}
          </ScreenHeaderAction>
        }
        backHref='/setting'
        backLabel='設定'
      />
      <div className='flex flex-col gap-3 px-4'>
        <ScreenTitle badge={isPair ? 'pair' : 'self'}>予定カテゴリ</ScreenTitle>
        <ScreenLead>
          予定を追加するときに選ぶカテゴリです。色はカレンダーの帯の色になります
        </ScreenLead>

        {ordered.length > 0 ? (
          <SectionList>
            <SortableList
              disabled={!isEditing}
              items={ordered}
              onReorder={reorder}
              renderItem={(card, { handleProps }) => (
                <NameCell
                  ariaLabel={`${card.name}を編集`}
                  colorName={card.colorName}
                  handle={
                    isEditing ? <SortableHandle {...handleProps} /> : undefined
                  }
                  isEditing={isEditing}
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

        {isEditing ? null : (
          <AddRow
            label='予定カテゴリを追加'
            onClick={() => setSheet({ kind: 'create' })}
          />
        )}

        <ScreenNote>
          {isEditing
            ? 'ドラッグして並べ替えます。並び順は予定を追加するときの候補の並びになります。'
            : '行をタップすると名前と色を変えられます。「編集」で並べ替え。'}
        </ScreenNote>
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
