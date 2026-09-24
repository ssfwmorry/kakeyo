'use client';

import { Button } from '@/components/ui/button';
import { colorHex } from '@/features/master';
import type { SubTypeCard, TypeCard } from '../types';
import type { TypeSelectionView } from './use-type-selection';

// カテゴリ選択の表示部品（record / planned_record の note フォームが共有する）。
//
// どちらのフォームも「カテゴリを選ぶ → サブカテゴリがあれば選ぶ → 選び直せる」という
// 同じ手順を踏むため、その見た目をここに集める。差分は空状態の文言だけなので props で
// 受ける（文言は各 feature の labels が持つ＝所有境界を越えない）。

// 「未選択ならカテゴリ grid、選択済みなら選び直しリンク、サブカテゴリ待ちなら
// その grid」の出し分け。両フォームの選択部はこの 1 個で足りる。
export function TypeSelectionArea({
  view,
  subTypeId,
  emptyMessage,
  onSelectType,
  onSelectSubType,
  onReset
}: {
  view: TypeSelectionView;
  subTypeId: number | null;
  emptyMessage: string;
  onSelectType: (typeId: number) => void;
  onSelectSubType: (subTypeId: number) => void;
  onReset: () => void;
}) {
  return (
    <>
      {view.isTypeChosen ? (
        <ChosenTypeSummary
          selectedType={view.selectedType}
          subTypes={view.subTypes}
          subTypeId={subTypeId}
          onReset={onReset}
        />
      ) : (
        <TypeGrid
          types={view.types}
          emptyMessage={emptyMessage}
          onSelect={onSelectType}
        />
      )}
      {view.showSubTypeGrid ? (
        <SubTypeGrid subTypes={view.subTypes} onSelect={onSelectSubType} />
      ) : null}
    </>
  );
}

// カテゴリは色丸のグリッドで選ばせる。色は一覧のマーカーと同じ丸で、名前を下に添える。
function TypeGrid({
  types,
  emptyMessage,
  onSelect
}: {
  types: TypeCard[];
  // カテゴリ・方法が未設定のときの案内。
  emptyMessage: string;
  onSelect: (typeId: number) => void;
}) {
  if (types.length === 0) {
    return (
      <p className='text-center text-sm text-muted-foreground'>
        {emptyMessage}
      </p>
    );
  }
  return (
    <div className='grid grid-cols-4 gap-3'>
      {types.map((type) => (
        <button
          key={type.id}
          type='button'
          className='flex flex-col items-center gap-1'
          onClick={() => onSelect(type.id)}
        >
          <span
            className='size-12 rounded-full'
            style={{ backgroundColor: colorHex(type.colorName) }}
          />
          <span className='text-xs'>{type.name}</span>
        </button>
      ))}
    </div>
  );
}

// 選択済みのカテゴリ。押すと選択を捨てて grid に戻す（やり直しの唯一の導線）。
function ChosenTypeSummary({
  selectedType,
  subTypes,
  subTypeId,
  onReset
}: {
  selectedType: TypeCard | null;
  subTypes: SubTypeCard[];
  subTypeId: number | null;
  onReset: () => void;
}) {
  const subName =
    subTypeId === null
      ? ''
      : ` ＞ ${subTypes.find((sub) => sub.id === subTypeId)?.name ?? ''}`;
  return (
    <button
      type='button'
      className='self-start text-sm text-muted-foreground underline'
      onClick={onReset}
    >
      {selectedType?.name}
      {subName}（選び直す）
    </button>
  );
}

// サブカテゴリはカテゴリより従なので、色を持たせず名前だけのボタンにする。
function SubTypeGrid({
  subTypes,
  onSelect
}: {
  subTypes: SubTypeCard[];
  onSelect: (subTypeId: number) => void;
}) {
  return (
    <div className='grid grid-cols-3 gap-2'>
      {subTypes.map((sub) => (
        <Button
          key={sub.id}
          type='button'
          variant='secondary'
          onClick={() => onSelect(sub.id)}
        >
          {sub.name}
        </Button>
      ))}
    </div>
  );
}
