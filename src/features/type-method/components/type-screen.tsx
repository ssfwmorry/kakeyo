'use client';

import { useState } from 'react';
import { AddRowLink } from '@/components/add-row';
import { DeleteAlerts, useDeleteFlow } from '@/components/delete-flow';
import { NameCell } from '@/components/name-cell';
import { ScreenHeader, ScreenHeaderAction } from '@/components/screen-header';
import { ScreenNote, ScreenTitle } from '@/components/screen-title';
import { SectionList } from '@/components/section-list';
import {
  SortableHandle,
  SortableList,
  useSortableOrder
} from '@/components/sortable-list';
import { Segment } from '@/components/ui/segment';
import type { GroupedTypeList, TypeCard } from '@/features/type-method';
import {
  deleteTypeAction,
  reorderTypeAction
} from '@/features/type-method/actions';
import { summarizeSubTypes } from '../domain/sub-type-summary';

// 設定 › カテゴリ一覧（原典 SetType）。支出 / 収入のセグメントで切り替える。
//
// 方法と違い、カテゴリはサブカテゴリを持つので編集はシートではなく専用画面へ進む。
// 「編集」中は行頭に削除の −、行末にドラッグハンドルが出る。編集中でも名前を押せば
// 編集画面へ進める。

type PayTab = 'pay' | 'income';

const TAB_OPTIONS = [
  { value: 'pay', label: '支出' },
  { value: 'income', label: '収入' }
] as const satisfies readonly { value: PayTab; label: string }[];

export function TypeScreen({
  typeList,
  isPair
}: {
  typeList: GroupedTypeList;
  isPair: boolean;
}) {
  const [payTab, setPayTab] = useState<PayTab>('pay');
  const [isEditing, setIsEditing] = useState(false);
  const remove = useDeleteFlow({ deleteAction: deleteTypeAction });

  const bucket = typeList[payTab];
  const cards = isPair ? bucket.pair : bucket.self;

  return (
    <div className='flex flex-col'>
      <ScreenHeader
        action={
          <ScreenHeaderAction onClick={() => setIsEditing((prev) => !prev)}>
            {isEditing ? '完了' : '編集'}
          </ScreenHeaderAction>
        }
        backHref='/setting'
        backLabel='設定'
      />
      <div className='flex flex-col gap-3 px-4'>
        <ScreenTitle badge={isPair ? 'pair' : 'self'}>カテゴリ</ScreenTitle>

        <Segment
          label='カテゴリの種類'
          onChange={setPayTab}
          options={TAB_OPTIONS}
          size='md'
          value={payTab}
        />

        {cards.length > 0 ? (
          <SectionList>
            {/* 支出 / 収入で並べ替えの対象が入れ替わるので、タブごとに状態を作り直す。 */}
            <TypeRows
              cards={cards}
              isEditing={isEditing}
              key={payTab}
              onRemove={(card) => remove.ask({ id: card.id, name: card.name })}
              payTab={payTab}
            />
          </SectionList>
        ) : (
          <p className='px-1 text-muted-foreground text-sm'>
            カテゴリはまだありません。
          </p>
        )}

        <AddRowLink
          href={`/setting/type/new?isPay=${payTab === 'pay'}`}
          label='カテゴリを追加'
        />

        <ScreenNote>
          「編集」で並べ替えと削除。並び順は入力画面のカテゴリの並びにそのまま使われます。
        </ScreenNote>
      </div>

      <DeleteAlerts entity='カテゴリ' remove={remove} />
    </div>
  );
}

function TypeRows({
  cards,
  payTab,
  isEditing,
  onRemove
}: {
  cards: TypeCard[];
  payTab: PayTab;
  isEditing: boolean;
  onRemove: (card: TypeCard) => void;
}) {
  const { ordered, reorder } = useSortableOrder(cards, reorderTypeAction);

  return (
    <SortableList
      disabled={!isEditing}
      items={ordered}
      onReorder={reorder}
      renderItem={(card, { handleProps }) => (
        <NameCell
          colorName={card.colorName}
          description={summarizeSubTypes(card.subTypes.map((sub) => sub.name))}
          handle={isEditing ? <SortableHandle {...handleProps} /> : undefined}
          href={`/setting/type/${card.id}?isPay=${payTab === 'pay'}`}
          isEditing={isEditing}
          isFirst={card.id === ordered[0]?.id}
          isOpenableWhileEditing
          name={card.name}
          onRemove={() => onRemove(card)}
        />
      )}
    />
  );
}
