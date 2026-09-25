'use client';

import Link from 'next/link';
import { useState } from 'react';
import { IconClose } from '@/components/icons';
import { colorVar } from '@/features/master';
import type { ShortCutItem } from '@/features/memo-shortcut';
import { recordLabels } from '@/features/record/labels';
import type { TypeCard } from '@/features/type-method';
import { InitialCircle } from '@/v2/components/initial-circle';
import { PairModeSegment } from '@/v2/components/pair-mode-segment';
import { Segment } from '@/v2/components/ui/segment';
import { SubTypePickSheet } from './sub-type-pick-sheet';

// 入力フロー 1 枚目: カテゴリを選ぶ（デザイン NoteType / NoteTypePair）。
//
// 上から「閉じる｜個人｜共有」「支出｜収入」「いつもの」「カテゴリ」。
// カテゴリを押すとサブカテゴリのシートが開き、サブカテゴリが無ければそのまま 2 枚目へ進む。
// 「いつもの」はショートカットで、押すと中身が入った状態で 2 枚目へ進む。

const PAY_OPTIONS = [
  { value: 'pay', label: recordLabels.payToggle.pay },
  { value: 'income', label: recordLabels.payToggle.income }
] as const;

export function TypeStep({
  isPair,
  isPay,
  types,
  shortcuts,
  onPayChange,
  onPickType,
  onPickShortcut
}: {
  isPair: boolean;
  isPay: boolean;
  types: TypeCard[];
  shortcuts: ShortCutItem[];
  onPayChange: (isPay: boolean) => void;
  onPickType: (typeId: number, subTypeId: number | null) => void;
  onPickShortcut: (item: ShortCutItem) => void;
}) {
  // サブカテゴリを選ばせているカテゴリ。null なら閉じている。
  const [sheetType, setSheetType] = useState<TypeCard | null>(null);

  const pick = (type: TypeCard) => {
    if (type.subTypes.length === 0) {
      onPickType(type.id, null);
      return;
    }
    setSheetType(type);
  };

  return (
    <div className='flex flex-col gap-3 px-4 pb-8'>
      <div className='flex h-11 items-center justify-between'>
        <Link
          aria-label='閉じる'
          className='flex size-9 items-center justify-center rounded-full bg-muted text-foreground'
          href='/v2/calendar'
        >
          <IconClose
            aria-hidden='true'
            className='size-4.5'
            strokeWidth={2.4}
          />
        </Link>
        <PairModeSegment isPair={isPair} />
      </div>

      <Segment
        label='収支'
        onChange={(value) => onPayChange(value === 'pay')}
        options={PAY_OPTIONS}
        value={isPay ? 'pay' : 'income'}
      />

      {shortcuts.length > 0 ? (
        <ShortcutGrid items={shortcuts} onPick={onPickShortcut} />
      ) : null}

      <div className='mt-1 flex flex-col gap-2'>
        <span className='font-semibold text-[13px] text-muted-foreground'>
          カテゴリ
        </span>
        {types.length === 0 ? (
          <p className='px-1 text-muted-foreground text-sm'>
            {recordLabels.empty.noTypeMethod}
          </p>
        ) : (
          <div className='grid grid-cols-4 gap-2'>
            {types.map((type) => (
              <button
                className='flex h-20 flex-col items-center justify-center gap-1.5 rounded-[14px] bg-card'
                key={type.id}
                onClick={() => pick(type)}
                type='button'
              >
                <InitialCircle
                  colorName={type.colorName}
                  name={type.name}
                  size={40}
                />
                <span className='max-w-full truncate px-1 font-semibold text-foreground text-xs'>
                  {type.name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {sheetType === null ? null : (
        <SubTypePickSheet
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setSheetType(null);
            }
          }}
          onPick={(subTypeId) => {
            onPickType(sheetType.id, subTypeId);
            setSheetType(null);
          }}
          type={sheetType}
        />
      )}
    </div>
  );
}

// 「いつもの」。ショートカットを 2 列のカードで出す。色の点と「カテゴリ › サブカテゴリ」、
// 下段に「方法 · メモ」。
function ShortcutGrid({
  items,
  onPick
}: {
  items: ShortCutItem[];
  onPick: (item: ShortCutItem) => void;
}) {
  return (
    <div className='flex flex-col gap-2'>
      <span className='font-semibold text-[13px] text-muted-foreground'>
        いつもの（タップで金額入力へ）
      </span>
      <div className='grid grid-cols-2 gap-2'>
        {items.map((item) => (
          <button
            className='flex h-14 items-center gap-2.5 rounded-[14px] bg-card px-3 text-left text-foreground'
            key={item.id}
            onClick={() => onPick(item)}
            type='button'
          >
            <span
              aria-hidden='true'
              className='size-2.5 shrink-0 rounded-full'
              style={{ backgroundColor: colorVar(item.colorName) }}
            />
            <span className='flex min-w-0 flex-col gap-0.5'>
              <span className='truncate font-semibold text-sm'>
                {item.typeName}
                {item.subTypeName === null ? '' : ` › ${item.subTypeName}`}
              </span>
              <span className='truncate text-muted-foreground text-xs'>
                {item.methodName}
                {item.memo === null ? '' : ` · ${item.memo}`}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
