'use client';

import { Fragment, useState } from 'react';
import { InitialCircle } from '@/components/initial-circle';
import { PairModeSegment } from '@/components/pair-mode-segment';
import { SheetHeader } from '@/components/sheet-header';
import { Segment } from '@/components/ui/segment';
import { colorVar } from '@/features/master';
import { recordLabels } from '@/features/record/labels';
import type { TypeCard } from '@/features/type-method';
import type { Id } from '@/lib/shared/types/id';

// 入力① カテゴリを選ぶ（原典 NoteType / NoteTypePair / NoteSub）。
//
// カテゴリは 4 列のグリッド。サブカテゴリを持つカテゴリを押すと、その行の直下に
// 全幅のパネルが開いてサブカテゴリのチップが並ぶ。別の画面へ送らずその場で開くのは、
// 「カテゴリ → サブカテゴリ」が 1 つの選択であることを見せるため。

const PAY_OPTIONS = [
  { value: 'pay', label: recordLabels.payToggle.pay },
  { value: 'income', label: recordLabels.payToggle.income }
] as const;

const COLUMNS = 4;

export function TypeStep({
  isPair,
  hasPair,
  isPairLocked,
  isPay,
  types,
  onClose,
  onPayChange,
  onPick
}: {
  isPair: boolean;
  hasPair: boolean;
  isPairLocked: boolean;
  isPay: boolean;
  types: TypeCard[];
  onClose: () => void;
  onPayChange: (isPay: boolean) => void;
  // サブカテゴリを選ばずに進んだときは subTypeId が null。
  onPick: (typeId: Id, subTypeId: Id | null) => void;
}) {
  // 展開中のカテゴリ。収支を切り替えると候補ごと入れ替わるので閉じる。
  const [expandedId, setExpandedId] = useState<Id | null>(null);

  return (
    <>
      <SheetHeader
        left='close'
        onLeft={onClose}
        right={
          <PairModeSegment
            hasPair={hasPair}
            isLocked={isPairLocked}
            isPair={isPair}
          />
        }
        // 原典にタイトル文字は無い。Drawer のアクセシブルネームだけ付ける。
        title={<span className='sr-only'>入力</span>}
      />

      <Segment
        label='収支'
        onChange={(value) => {
          setExpandedId(null);
          onPayChange(value === 'pay');
        }}
        options={PAY_OPTIONS}
        size='lg'
        value={isPay ? 'pay' : 'income'}
      />

      <div className='mt-1 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto'>
        <span className='font-semibold text-[13px] text-muted-foreground'>
          カテゴリ
        </span>
        {types.length === 0 ? (
          <p className='px-1 text-muted-foreground text-sm'>
            {recordLabels.empty.noTypeMethod}
          </p>
        ) : (
          <TypeGrid
            expandedId={expandedId}
            onPick={onPick}
            onToggle={(typeId) =>
              setExpandedId((prev) => (prev === typeId ? null : typeId))
            }
            types={types}
          />
        )}
      </div>
    </>
  );
}

// 4 列のカテゴリ格子。入力①のほか、定期の記録のカテゴリ選択も同じ格子を使う。
// selectedId を渡すと、展開していないあいだそのセルに選択中の枠を出す（選び直しのとき）。
export function TypeGrid({
  types,
  expandedId,
  selectedId = null,
  onToggle,
  onPick
}: {
  types: TypeCard[];
  expandedId: Id | null;
  selectedId?: Id | null;
  onToggle: (typeId: Id) => void;
  onPick: (typeId: Id, subTypeId: Id | null) => void;
}) {
  const expandedIndex = types.findIndex((type) => type.id === expandedId);
  const expanded = expandedIndex === -1 ? null : types[expandedIndex];
  // パネルは展開中のセルがある行の末尾に差し込む（grid の行を跨がせない）。
  const panelAfterIndex =
    expanded === null
      ? -1
      : Math.min(
          expandedIndex - (expandedIndex % COLUMNS) + COLUMNS - 1,
          types.length - 1
        );

  return (
    <div className='grid grid-cols-4 gap-2'>
      {types.map((type, index) => (
        <Fragment key={type.id}>
          <TypeCell
            isExpanded={type.id === expandedId}
            isSelected={expandedId === null && type.id === selectedId}
            onClick={() =>
              type.subTypes.length === 0
                ? onPick(type.id, null)
                : onToggle(type.id)
            }
            type={type}
          />
          {expanded !== null && index === panelAfterIndex ? (
            <SubTypePanel
              column={expandedIndex % COLUMNS}
              onPick={(subTypeId) => onPick(expanded.id, subTypeId)}
              type={expanded}
            />
          ) : null}
        </Fragment>
      ))}
    </div>
  );
}

function TypeCell({
  type,
  isExpanded,
  isSelected,
  onClick
}: {
  type: TypeCard;
  isExpanded: boolean;
  isSelected: boolean;
  onClick: () => void;
}) {
  const hasSubTypes = type.subTypes.length > 0;
  return (
    <button
      aria-expanded={hasSubTypes ? isExpanded : undefined}
      className='flex h-20 flex-col items-center justify-center gap-1.5 rounded-[14px] bg-card'
      onClick={onClick}
      style={
        isExpanded || isSelected
          ? { boxShadow: `inset 0 0 0 2px ${colorVar(type.colorName)}` }
          : undefined
      }
      type='button'
    >
      <InitialCircle colorName={type.colorName} name={type.name} size={40} />
      <span className='max-w-full truncate px-1 font-semibold text-foreground text-xs'>
        {type.name}
      </span>
    </button>
  );
}

// 展開したカテゴリのサブカテゴリ。上向きのキャレットで、どのセルから開いたかを示す。
function SubTypePanel({
  type,
  column,
  onPick
}: {
  type: TypeCard;
  // 展開元のセルの列（0 始まり）。キャレットの横位置に使う。
  column: number;
  onPick: (subTypeId: Id | null) => void;
}) {
  return (
    <div className='relative col-span-full my-0.5 mb-1 flex flex-col gap-2.5 rounded-2xl bg-card px-3 pt-3.5 pb-3'>
      <span
        aria-hidden='true'
        className='-top-1.5 absolute size-3 rotate-45 rounded-[2px] bg-card'
        // 列の中心 = 列幅の半分 + 左にある列の幅と間隔。列幅は grid が決めるので
        // 実寸ではなく割合で置く。
        style={{
          left: `calc((100% - ${(COLUMNS - 1) * 8}px) / ${COLUMNS} * ${column + 0.5} + ${column * 8}px - 6px)`
        }}
      />
      <span className='font-semibold text-[12px] text-muted-foreground'>
        {type.name}のサブカテゴリ
      </span>
      <div className='flex flex-wrap gap-2'>
        {type.subTypes.map((sub) => (
          <button
            className='flex h-10 items-center whitespace-nowrap rounded-[20px] bg-background px-4 font-semibold text-[15px] text-foreground'
            key={sub.id}
            onClick={() => onPick(sub.id)}
            type='button'
          >
            {sub.name}
          </button>
        ))}
        <button
          className='flex h-10 items-center whitespace-nowrap rounded-[20px] border border-dash border-dashed px-4 text-[14px] text-muted-foreground'
          onClick={() => onPick(null)}
          type='button'
        >
          なしで進む
        </button>
      </div>
    </div>
  );
}
