'use client';

import { cn } from 'cn';
import { useState } from 'react';
import { AddRow } from '@/components/add-row';
import { IconLock } from '@/components/icons';
import { ListCellSortable, ListCellStatic } from '@/components/list-cell';
import { ScreenHeader } from '@/components/screen-header';
import { ScreenLead, ScreenNote, ScreenTitle } from '@/components/screen-title';
import { SectionList, SectionListEmpty } from '@/components/section-list';
import {
  SortableHandle,
  SortableList,
  useSortableOrder
} from '@/components/sortable-list';
import type { DayClassification } from '@/features/master';
import { colorVar } from '@/features/master';
import type { PlannedRecordListItem } from '@/features/planned-record';
import { reorderPlannedRecordAction } from '@/features/planned-record/actions';
import type {
  GroupedMethodList,
  GroupedTypeList
} from '@/features/type-method';
import { amountToneClass, formatPrice } from '@/lib/shared/domain/format';
import {
  isLockedItem,
  itemDescription,
  itemTitle,
  toPlannedRecordDefault
} from '../domain/row-text';
import { PlannedRecordSheet } from './planned-record-sheet';

// 設定 › 定期の記録（原典 SetPlanned）。
//
// 毎月の収入・支出を 2 枚のカードで見せ、その下に「毎月 D 日」つきの一覧を置く。
// 行を押すと詳細シート（編集）、追加行はカテゴリのシートから始まる。
//
// 共有ではパートナーが立て替える定期も見えるが、編集できるのはパートナーだけなので
// 行を押せなくして南京錠を出す（並べ替えのハンドルも出さない）。

type SheetState =
  | { kind: 'closed' }
  | { kind: 'create'; key: number }
  | { kind: 'edit'; item: PlannedRecordListItem; key: number };

export function PlannedRecordScreen({
  items,
  isPair,
  typeList,
  methodList,
  dayClassifications,
  today
}: {
  items: PlannedRecordListItem[];
  isPair: boolean;
  typeList: GroupedTypeList;
  methodList: GroupedMethodList;
  dayClassifications: DayClassification[];
  today: string;
}) {
  const [sheet, setSheet] = useState<SheetState>({ kind: 'closed' });
  const { ordered, reorder } = useSortableOrder(
    items,
    reorderPlannedRecordAction
  );

  // 開くたびに key を変えてシートを作り直す（前回の入力を残さない）。
  const nextKey = () => (sheet.kind === 'closed' ? 0 : sheet.key) + 1;
  const closeSheet = () => setSheet({ kind: 'closed' });

  // 毎月の増減。定期は毎月 1 回なので金額をそのまま足す。
  const incomeTotal = sumPrice(ordered, false);
  const payTotal = sumPrice(ordered, true);
  const dayValueOf = (id: number) =>
    dayClassifications.find((day) => day.id === id)?.value ?? null;

  return (
    <div className='flex flex-col'>
      <ScreenHeader backHref='/setting' backLabel='設定' />
      <div className='flex flex-col gap-3 px-3'>
        <ScreenTitle badge={isPair ? 'pair' : 'self'}>定期の記録</ScreenTitle>
        <ScreenLead>毎月決まった日に、自動で記録されます</ScreenLead>

        <div className='grid grid-cols-2 gap-2'>
          <TotalCard amount={incomeTotal} isIncome label='毎月の収入' />
          <TotalCard amount={payTotal} isIncome={false} label='毎月の支出' />
        </div>

        <PlannedList
          dayValueOf={dayValueOf}
          items={ordered}
          onOpen={(item) => setSheet({ kind: 'edit', item, key: nextKey() })}
          onReorder={reorder}
        />

        <AddRow
          label='定期の記録を追加'
          onClick={() => setSheet({ kind: 'create', key: nextKey() })}
        />

        <ScreenNote>{footnote(isPair)}</ScreenNote>
      </div>

      {sheet.kind === 'closed' ? null : (
        <PlannedRecordSheet
          dayClassifications={dayClassifications}
          editing={
            sheet.kind === 'edit'
              ? toPlannedRecordDefault(sheet.item)
              : undefined
          }
          isPair={sheet.kind === 'edit' ? sheet.item.isPair : isPair}
          key={sheet.key}
          methodList={methodList}
          onClose={closeSheet}
          onSaved={closeSheet}
          today={today}
          typeList={typeList}
        />
      )}
    </div>
  );
}

function footnote(isPair: boolean): string {
  const base =
    '行をタップすると編集・削除できます。≡ をドラッグすると並べ替えられ、並びはすぐ保存されます。';
  return isPair
    ? `${base}パートナーが立て替える定期の記録は、パートナーだけが編集できます。共有／個人は登録後に切り替えられません。`
    : base;
}

// 一覧のカード。空なら 1 文だけ。
function PlannedList({
  items,
  dayValueOf,
  onOpen,
  onReorder
}: {
  items: PlannedRecordListItem[];
  dayValueOf: (dayClassificationId: number) => number | null;
  onOpen: (item: PlannedRecordListItem) => void;
  onReorder: (ids: number[]) => void;
}) {
  return (
    <SectionList>
      {items.length === 0 ? (
        <SectionListEmpty>まだ定期の記録はありません</SectionListEmpty>
      ) : (
        <SortableList
          items={items}
          onReorder={onReorder}
          renderItem={(item, { handleProps }) => (
            <PlannedRow
              dayValue={dayValueOf(item.dayClassificationId)}
              handle={<SortableHandle {...handleProps} />}
              isFirst={item.id === items[0]?.id}
              item={item}
              onOpen={() => onOpen(item)}
            />
          )}
        />
      )}
    </SectionList>
  );
}

function sumPrice(items: PlannedRecordListItem[], isPay: boolean): number {
  return items
    .filter((item) => item.isPay === isPay)
    .reduce((sum, item) => sum + item.price, 0);
}

// 毎月の収入 / 支出。収入はアクセント、支出は本文色。
function TotalCard({
  label,
  amount,
  isIncome
}: {
  label: string;
  amount: number;
  isIncome: boolean;
}) {
  return (
    <div className='flex flex-col gap-0.5 rounded-[14px] bg-card px-3.5 py-3'>
      <span className='text-muted-foreground text-xs'>{label}</span>
      <span
        className={cn(
          'font-bold text-lg tabular-nums',
          amountToneClass(!isIncome)
        )}
      >
        {formatPrice(amount)}
      </span>
    </div>
  );
}

function PlannedRow({
  item,
  dayValue,
  isFirst,
  handle,
  onOpen
}: {
  item: PlannedRecordListItem;
  dayValue: number | null;
  isFirst: boolean;
  handle: React.ReactNode;
  onOpen: () => void;
}) {
  const title = itemTitle(item);
  const shared = {
    description: itemDescription(item),
    height: 64 as const,
    isFirst,
    label: (
      <span className='flex items-center gap-1.5 text-[15px]'>
        <span
          aria-hidden='true'
          className='size-2 shrink-0 rounded-full'
          style={{
            backgroundColor: colorVar(item.typeColorClassificationName)
          }}
        />
        {title}
      </span>
    ),
    leading: <DayBadge day={dayValue} />,
    value: (
      <span
        className={cn('font-semibold text-base', amountToneClass(item.isPay))}
      >
        {formatPrice(item.price)}
      </span>
    )
  };

  if (isLockedItem(item)) {
    return (
      <ListCellStatic
        {...shared}
        trailing={
          <IconLock
            aria-label='パートナーのみ編集できます'
            className='size-3.5 shrink-0 text-icon-muted'
            strokeWidth={2.2}
          />
        }
      />
    );
  }
  return (
    <ListCellSortable
      {...shared}
      aria-label={`毎月${dayValue ?? ''}日 ${title} を編集`}
      handle={handle}
      leadingWidth={40}
      onClick={onOpen}
    />
  );
}

// 行頭の日付。「毎月」を小さく上に載せ、日を大きく出すと一覧で縦に揃って読みやすい。
function DayBadge({ day }: { day: number | null }) {
  return (
    <span className='flex w-10 shrink-0 flex-col items-center'>
      <span className='text-[10px] text-muted-foreground'>毎月</span>
      <span className='font-bold text-[17px] leading-[1.1]'>
        {day === null ? '' : `${day}日`}
      </span>
    </span>
  );
}
