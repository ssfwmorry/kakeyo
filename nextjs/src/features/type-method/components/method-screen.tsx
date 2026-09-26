'use client';

import { useState } from 'react';
import { AddRow } from '@/components/add-row';
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
import type { ColorClassification } from '@/features/master';
import type { GroupedMethodList, MethodCard } from '@/features/type-method';
import {
  deleteMethodAction,
  reorderMethodAction
} from '@/features/type-method/actions';
import { MethodSheet, methodForeignKeyHandling } from './method-sheet';
import type { PayMode } from './pay-mode';

// 設定 › 方法（原典 SetMethod）。支払 / 受取 / 精算のセグメントで切り替える。
// 精算は共有モード専用なので、個人モードでは選択肢ごと出さない。
//
// 編集は行タップで開くシート。「編集」中は行頭に削除の −、行末にドラッグハンドルが出る。
// 編集中でも行を押してシートを開ける。

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
  const [isEditing, setIsEditing] = useState(false);
  const [sheet, setSheet] = useState<SheetState>({ kind: 'closed' });
  const remove = useDeleteFlow({
    deleteAction: deleteMethodAction,
    onForeignKey: methodForeignKeyHandling
  });

  const bucket = methodList[payMode];
  const cards = isPair ? bucket.pair : bucket.self;
  const text = TAB_TEXT[payMode];

  // 精算はペアで立替をやり取りするための区分なので、個人モードでは出さない。
  const options = (
    isPair ? (['pay', 'income', 'both'] as const) : (['pay', 'income'] as const)
  ).map((value) => ({ value, label: TAB_TEXT[value].label }));

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
        <ScreenTitle badge={isPair ? 'pair' : 'self'}>方法</ScreenTitle>

        <Segment
          label='方法の種類'
          onChange={(value) => {
            setPayMode(value);
            setSheet({ kind: 'closed' });
          }}
          options={options}
          size='md'
          value={payMode}
        />
        <ScreenNote>{text.note}</ScreenNote>

        {cards.length > 0 ? (
          <SectionList>
            {/* 区分ごとに並べ替えの対象が入れ替わるので、タブごとに状態を作り直す。 */}
            <MethodRows
              cards={cards}
              isEditing={isEditing}
              key={payMode}
              onOpen={(card) => setSheet({ kind: 'edit', card })}
              onRemove={(card) => remove.ask({ id: card.id, name: card.name })}
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
          「編集」で並べ替えと削除。並び順は入力画面・精算画面の候補の並びにそのまま使われます。個人モードでは「精算」は出ません。
        </ScreenNote>
      </div>

      <DeleteAlerts
        entity={text.entity}
        onForeignKey={methodForeignKeyHandling}
        remove={remove}
      />

      {sheet.kind === 'closed' ? null : (
        <MethodSheet
          colors={colors}
          entityName={text.entity}
          isOpen
          isPair={isPair}
          // 編集対象ごとにフォームを作り直す（useForm の defaultValue は
          // マウント時にしか取り込まれないため）。
          key={sheet.kind === 'edit' ? sheet.card.id : 'create'}
          method={sheet.kind === 'edit' ? sheet.card : undefined}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setSheet({ kind: 'closed' });
            }
          }}
          payMode={payMode}
          placeholder={text.placeholder}
        />
      )}
    </div>
  );
}

function MethodRows({
  cards,
  isEditing,
  onOpen,
  onRemove
}: {
  cards: MethodCard[];
  isEditing: boolean;
  onOpen: (card: MethodCard) => void;
  onRemove: (card: MethodCard) => void;
}) {
  const { ordered, reorder } = useSortableOrder(cards, reorderMethodAction);

  return (
    <SortableList
      disabled={!isEditing}
      items={ordered}
      onReorder={reorder}
      renderItem={(card, { handleProps }) => (
        <NameCell
          colorName={card.colorName}
          handle={isEditing ? <SortableHandle {...handleProps} /> : undefined}
          isEditing={isEditing}
          isFirst={card.id === ordered[0]?.id}
          isOpenableWhileEditing
          name={card.name}
          onOpen={() => onOpen(card)}
          onRemove={() => onRemove(card)}
        />
      )}
    />
  );
}
