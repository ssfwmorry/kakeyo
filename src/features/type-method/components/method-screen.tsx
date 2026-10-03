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
import type { GroupedMethodList, MethodCard } from '@/features/type-method';
import { reorderMethodAction } from '@/features/type-method/actions';
import { MethodSheet } from './method-sheet';
import type { PayMode } from './pay-mode';

// 設定 › 方法（原典 SetMethod）。支払 / 受取 / 精算のセグメントで切り替える。

const TAB_TEXT: Record<
  PayMode,
  { label: string; entity: string; note: string; placeholder: string }
> = {
  pay: {
    label: '支払',
    entity: '支払方法',
    note: '支出を記録するときに選ぶ方法です',
    placeholder: '例：楽天カード'
  },
  income: {
    label: '受取',
    entity: '受取方法',
    note: '収入を記録するときに選ぶ方法です',
    placeholder: '例：共有口座'
  },
  both: {
    label: '精算',
    entity: '精算方法',
    note: '集計の「精算」で、立替分をやり取りするときに選ぶ方法です',
    placeholder: '例：現金手渡し'
  }
};

type SheetState =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; card: MethodCard };

export function MethodScreen({
  methodList,
  colors,
  isPair
}: {
  methodList: GroupedMethodList;
  colors: ColorClassification[];
  isPair: boolean;
}) {
  const [payMode, setPayMode] = useState<PayMode>('pay');
  const [sheet, setSheet] = useState<SheetState>({ kind: 'closed' });

  const bucket = methodList[payMode];
  const cards = isPair ? bucket.pair : bucket.self;
  const text = TAB_TEXT[payMode];
  const options = tabOptions(isPair);
  const closeSheet = () => setSheet({ kind: 'closed' });

  return (
    <div className='flex flex-col'>
      <ScreenHeader backHref='/setting' backLabel='設定' />
      <div className='flex flex-col gap-3 px-3'>
        <ScreenTitle badge={isPair ? 'pair' : 'self'}>方法</ScreenTitle>

        <Segment
          label='方法の種類'
          onChange={(value) => {
            setPayMode(value);
            closeSheet();
          }}
          options={options}
          size='md'
          value={payMode}
        />
        <ScreenNote>{text.note}</ScreenNote>

        {cards.length > 0 ? (
          <SectionList>
            <MethodRows
              cards={cards}
              key={payMode}
              onOpen={(card) => setSheet({ kind: 'edit', card })}
            />
          </SectionList>
        ) : (
          <p className='px-1 text-muted-foreground text-sm'>
            {text.entity}はまだありません。
          </p>
        )}

        <AddRow
          label={`${text.entity}を追加`}
          onClick={() => setSheet({ kind: 'create' })}
        />

        <ScreenNote>
          行をタップすると名前と色を変えられます。≡
          をドラッグすると並べ替えられ、並びはすぐ保存されます。並び順は入力画面・精算画面の候補の並びになります。個人モードでは「精算」は出ません。
        </ScreenNote>
      </div>

      {sheet.kind === 'closed' ? null : (
        <MethodSheet
          colors={colors}
          entityName={text.entity}
          isOpen
          isPair={isPair}
          key={sheet.kind === 'edit' ? sheet.card.id : 'create'}
          method={sheet.kind === 'edit' ? sheet.card : undefined}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              closeSheet();
            }
          }}
          payMode={payMode}
          placeholder={text.placeholder}
        />
      )}
    </div>
  );
}

// 精算はペアで立替をやり取りするための区分なので、個人モードでは出さない。
function tabOptions(isPair: boolean) {
  const modes = isPair
    ? (['pay', 'income', 'both'] as const)
    : (['pay', 'income'] as const);
  return modes.map((value) => ({ value, label: TAB_TEXT[value].label }));
}

function MethodRows({
  cards,
  onOpen
}: {
  cards: MethodCard[];
  onOpen: (card: MethodCard) => void;
}) {
  const { ordered, reorder } = useSortableOrder(cards, reorderMethodAction);

  return (
    <SortableList
      items={ordered}
      onReorder={reorder}
      renderItem={(card, { handleProps }) => (
        <NameCell
          colorName={card.colorName}
          handle={<SortableHandle {...handleProps} />}
          isFirst={card.id === ordered[0]?.id}
          name={card.name}
          onOpen={() => onOpen(card)}
        />
      )}
    />
  );
}
