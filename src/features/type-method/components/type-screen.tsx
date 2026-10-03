'use client';

import { useState } from 'react';
import { AddRow } from '@/components/add-row';
import { NameCell } from '@/components/name-cell';
import { ScreenHeader } from '@/components/screen-header';
import { ScreenNote, ScreenTitle } from '@/components/screen-title';
import { SectionList } from '@/components/section-list';
import {
  SortableHandle,
  SortableList,
  useSortableOrder
} from '@/components/sortable-list';
import { Segment } from '@/components/ui/segment';
import type { ColorClassification } from '@/features/master';
import type { GroupedTypeList, TypeCard } from '@/features/type-method';
import { reorderTypeAction } from '@/features/type-method/actions';
import { summarizeSubTypes } from '../domain/sub-type-summary';
import { TypeSheet } from './type-sheet';

// 設定 › カテゴリ一覧（原典 SetType）。支出 / 収入のセグメントで切り替える。
//
// シートの対象は id で持ち、描画のたびに一覧から引き直す。シートの中で名前や色を
// 保存すると一覧が再検証されるので、カードを握ったままだと古い名前が残る。

type PayTab = 'pay' | 'income';

const TAB_OPTIONS = [
  { value: 'pay', label: '支出' },
  { value: 'income', label: '収入' }
] as const satisfies readonly { value: PayTab; label: string }[];

type SheetState =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; typeId: number };

export function TypeScreen({
  typeList,
  colors,
  isPair
}: {
  typeList: GroupedTypeList;
  colors: ColorClassification[];
  isPair: boolean;
}) {
  const [payTab, setPayTab] = useState<PayTab>('pay');
  const [sheet, setSheet] = useState<SheetState>({ kind: 'closed' });

  const bucket = typeList[payTab];
  const cards = isPair ? bucket.pair : bucket.self;
  const isPay = payTab === 'pay';
  // 一覧から消えていたら（削除済み）シートも出さない。
  const editingCard =
    sheet.kind === 'edit'
      ? cards.find((card) => card.id === sheet.typeId)
      : undefined;
  const closeSheet = () => setSheet({ kind: 'closed' });

  return (
    <div className='flex flex-col'>
      <ScreenHeader backHref='/setting' backLabel='設定' />
      <div className='flex flex-col gap-3 px-3'>
        <ScreenTitle badge={isPair ? 'pair' : 'self'}>カテゴリ</ScreenTitle>

        <Segment
          label='カテゴリの種類'
          onChange={(value) => {
            setPayTab(value);
            closeSheet();
          }}
          options={TAB_OPTIONS}
          size='md'
          value={payTab}
        />

        {cards.length > 0 ? (
          <SectionList>
            {/* 支出 / 収入で並べ替えの対象が入れ替わるので、タブごとに状態を作り直す。 */}
            <TypeRows
              cards={cards}
              key={payTab}
              onOpen={(card) => setSheet({ kind: 'edit', typeId: card.id })}
            />
          </SectionList>
        ) : (
          <p className='px-1 text-muted-foreground text-sm'>
            カテゴリはまだありません。
          </p>
        )}

        <AddRow
          label='カテゴリを追加'
          onClick={() => setSheet({ kind: 'create' })}
        />

        <ScreenNote>
          行をタップするとサブカテゴリと名前・色を変えられます。≡
          をドラッグすると並べ替えられ、並びはすぐ保存されます。並び順は入力画面のカテゴリの並びになります。
        </ScreenNote>
      </div>

      {sheet.kind === 'create' ? (
        <TypeSheet
          colors={colors}
          isPair={isPair}
          isPay={isPay}
          onClose={closeSheet}
        />
      ) : null}
      {editingCard !== undefined ? (
        <TypeSheet
          colors={colors}
          isPair={isPair}
          isPay={isPay}
          // 対象ごとにシートを作り直す（ビューの状態とフォームの初期値を持ち越さない）。
          key={editingCard.id}
          onClose={closeSheet}
          type={editingCard}
        />
      ) : null}
    </div>
  );
}

function TypeRows({
  cards,
  onOpen
}: {
  cards: TypeCard[];
  onOpen: (card: TypeCard) => void;
}) {
  const { ordered, reorder } = useSortableOrder(cards, reorderTypeAction);

  return (
    <SortableList
      items={ordered}
      onReorder={reorder}
      renderItem={(card, { handleProps }) => (
        <NameCell
          colorName={card.colorName}
          description={summarizeSubTypes(card.subTypes.map((sub) => sub.name))}
          handle={<SortableHandle {...handleProps} />}
          isFirst={card.id === ordered[0]?.id}
          name={card.name}
          onOpen={() => onOpen(card)}
        />
      )}
    />
  );
}
