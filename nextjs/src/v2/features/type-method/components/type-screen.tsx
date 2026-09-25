'use client';

import { useState } from 'react';
import { SwapButton } from '@/components/form/swap-button';
import { IconArrowDown } from '@/components/icons';
import type { GroupedTypeList, TypeCard } from '@/features/type-method';
import { swapTypeAction } from '@/features/type-method/actions';
import { AddRowLink } from '@/v2/components/add-row';
import { NameCell } from '@/v2/components/name-cell';
import { ScreenHeader } from '@/v2/components/screen-header';
import { ScreenTitle } from '@/v2/components/screen-title';
import { SectionList } from '@/v2/components/section-list';
import { Segment } from '@/v2/components/ui/segment';

// 設定 › カテゴリ一覧（新デザイン）。支出 / 収入のセグメントで切り替える。
//
// 方法と違い、カテゴリはサブカテゴリを持つので編集はシートではなく専用画面へ進む
// （デザイン基礎 SetType → SetTypeEdit）。
//
// 並べ替えはデザインではドラッグハンドルだが、既存の swap（下と入れ替え）を使う。

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

  const bucket = typeList[payTab];
  const cards = isPair ? bucket.pair : bucket.self;

  return (
    <div className='flex flex-col'>
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
        <ScreenTitle badge={isPair ? 'pair' : 'self'}>カテゴリ</ScreenTitle>

        <Segment
          label='カテゴリの種類'
          onChange={setPayTab}
          options={TAB_OPTIONS}
          value={payTab}
        />

        {cards.length > 0 ? (
          <SectionList>
            {cards.map((card, index) => (
              <TypeRow
                card={card}
                isEditing={isEditing}
                isFirst={index === 0}
                key={card.id}
                nextId={cards[index + 1]?.id}
                payTab={payTab}
              />
            ))}
          </SectionList>
        ) : (
          <p className='px-1 text-muted-foreground text-sm'>
            カテゴリはまだありません。
          </p>
        )}

        <AddRowLink
          href={`/v2/setting/type/new?isPay=${payTab === 'pay'}`}
          label='カテゴリを追加'
        />

        <p className='px-1 text-muted-foreground text-xs leading-relaxed'>
          「編集」で並べ替え。並び順は入力画面のカテゴリの並びにそのまま使われます。
        </p>
      </div>
    </div>
  );
}

function TypeRow({
  card,
  payTab,
  isEditing,
  isFirst,
  nextId
}: {
  card: TypeCard;
  payTab: PayTab;
  isEditing: boolean;
  isFirst: boolean;
  nextId?: number;
}) {
  // サブカテゴリは最初の 2 件までを並べ、それ以上は件数で畳む。
  // 行の高さを一定に保ちつつ、何が入っているかの手がかりは残す。
  const subNames = card.subTypes.map((sub) => sub.name);
  const description =
    subNames.length === 0
      ? 'サブカテゴリなし'
      : subNames.length <= 2
        ? subNames.join('、')
        : `${subNames.slice(0, 2).join('、')} ほか${subNames.length - 2}件`;

  return (
    <NameCell
      colorName={card.colorName}
      description={description}
      href={`/v2/setting/type/${card.id}?isPay=${payTab === 'pay'}`}
      isEditing={isEditing}
      isFirst={isFirst}
      name={card.name}
      swap={
        nextId === undefined ? undefined : (
          <SwapButton
            action={swapTypeAction}
            icon={<IconArrowDown className='size-4' />}
            label='下と入れ替え'
            nextId={nextId}
            prevId={card.id}
          />
        )
      }
    />
  );
}
