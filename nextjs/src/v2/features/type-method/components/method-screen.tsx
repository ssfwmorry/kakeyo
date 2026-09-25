'use client';

import { useState } from 'react';
import { SwapButton } from '@/components/form/swap-button';
import { IconArrowDown } from '@/components/icons';
import type { ColorClassification } from '@/features/master';
import type { GroupedMethodList, MethodCard } from '@/features/type-method';
import { swapMethodAction } from '@/features/type-method/actions';
import { AddRow } from '@/v2/components/add-row';
import { NameCell } from '@/v2/components/name-cell';
import { ScreenHeader } from '@/v2/components/screen-header';
import { ScreenTitle } from '@/v2/components/screen-title';
import { SectionList } from '@/v2/components/section-list';
import { Segment } from '@/v2/components/ui/segment';
import { MethodSheet } from './method-sheet';
import type { PayMode } from './pay-mode';

// 設定 › 方法（新デザイン）。支払 / 受取 / 精算のセグメントで切り替える。
// 精算は共有モード専用なので、個人モードでは選択肢ごと出さない。
//
// 旧画面との違いは、編集が別ダイアログではなく行タップで開くシートになったこと。
// 「編集」を押すと削除と並べ替えが行内に出る（デザイン基礎 SetMethod）。
//
// 並べ替えはデザインではドラッグハンドルだが、既存の swap（下と入れ替え）を使う。
// ドラッグ並べ替えは別途入れる。

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

  const bucket = methodList[payMode];
  const cards = isPair ? bucket.pair : bucket.self;
  const text = TAB_TEXT[payMode];

  // 精算はペアで立替をやり取りするための区分なので、個人モードでは出さない。
  const options = (
    isPair ? (['pay', 'income', 'both'] as const) : (['pay', 'income'] as const)
  ).map((value) => ({ value, label: TAB_TEXT[value].label }));

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
          方法
        </ScreenTitle>

        <Segment
          label='方法の種類'
          onChange={(value) => {
            setPayMode(value);
            setSheet({ kind: 'closed' });
          }}
          options={options}
          value={payMode}
        />
        <p className='px-1 text-muted-foreground text-xs leading-relaxed'>
          {text.note}
        </p>

        {cards.length > 0 ? (
          <SectionList>
            {cards.map((card, index) => (
              <NameCell
                colorName={card.colorName}
                isEditing={isEditing}
                isFirst={index === 0}
                key={card.id}
                name={card.name}
                onOpen={() => setSheet({ kind: 'edit', card })}
                swap={
                  cards[index + 1] === undefined ? undefined : (
                    <SwapButton
                      action={swapMethodAction}
                      icon={<IconArrowDown className='size-4' />}
                      label='下と入れ替え'
                      nextId={cards[index + 1].id}
                      prevId={card.id}
                    />
                  )
                }
              />
            ))}
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

        <p className='px-1 text-muted-foreground text-xs leading-relaxed'>
          「編集」で並べ替えと削除。並び順は入力画面・精算画面の候補の並びに
          そのまま使われます。個人モードでは「精算」は出ません。
        </p>
      </div>

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
