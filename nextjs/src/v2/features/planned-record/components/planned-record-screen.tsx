'use client';

import { cn } from 'cn';
import { useState } from 'react';
import { IconLock } from '@/components/icons';
import type { DayClassification } from '@/features/master';
import { colorVar } from '@/features/master';
import type { PlannedRecordListItem } from '@/features/planned-record';
import { reorderPlannedRecordAction } from '@/features/planned-record/actions';
import type {
  GroupedMethodList,
  GroupedTypeList
} from '@/features/type-method';
import { AddRow } from '@/v2/components/add-row';
import { ListCellButton, ListCellStatic } from '@/v2/components/list-cell';
import {
  ScreenHeader,
  ScreenHeaderAction
} from '@/v2/components/screen-header';
import {
  ScreenLead,
  ScreenNote,
  ScreenTitle
} from '@/v2/components/screen-title';
import { SectionList, SectionListEmpty } from '@/v2/components/section-list';
import {
  SortableHandle,
  SortableList,
  useSortableOrder
} from '@/v2/components/sortable-list';
import { formatSignedPrice } from '@/v2/lib/format';
import { dismissToast } from '@/v2/lib/toast';
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
// 「並べ替え」中は行末がハンドルになり、行タップと追加行を止める。
//
// 共有ではパートナーが立て替える定期も見えるが、編集できるのはパートナーだけなので
// 行を押せなくして南京錠を出す。

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
  const [isSorting, setIsSorting] = useState(false);
  const [sheet, setSheet] = useState<SheetState>({ kind: 'closed' });
  const { ordered, reorder } = useSortableOrder(
    items,
    reorderPlannedRecordAction
  );

  // 並べ替えの出入りで、開いていたシートと残っていたトーストを片付ける。
  const toggleSorting = () => {
    setIsSorting((prev) => !prev);
    setSheet({ kind: 'closed' });
    dismissToast();
  };
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
      <ScreenHeader
        action={
          <ScreenHeaderAction onClick={toggleSorting}>
            {isSorting ? '完了' : '並べ替え'}
          </ScreenHeaderAction>
        }
        backHref='/v2/setting'
        backLabel='設定'
      />
      <div className='flex flex-col gap-3 px-4'>
        <ScreenTitle badge={isPair ? 'pair' : 'self'}>定期の記録</ScreenTitle>
        <ScreenLead>毎月決まった日に、自動で記録されます</ScreenLead>

        <div className='grid grid-cols-2 gap-2'>
          <TotalCard amount={incomeTotal} isIncome label='毎月の収入' />
          <TotalCard amount={payTotal} isIncome={false} label='毎月の支出' />
        </div>

        <PlannedList
          dayValueOf={dayValueOf}
          isSorting={isSorting}
          items={ordered}
          onOpen={(item) => setSheet({ kind: 'edit', item, key: nextKey() })}
          onReorder={reorder}
        />

        {isSorting ? null : (
          <AddRow
            label='定期の記録を追加'
            onClick={() => setSheet({ kind: 'create', key: nextKey() })}
          />
        )}

        <ScreenNote>{footnote(isSorting, isPair)}</ScreenNote>
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

function footnote(isSorting: boolean, isPair: boolean): string {
  if (isSorting) {
    return 'ドラッグして並べ替えます。並び順は一覧の表示にだけ使われます。';
  }
  return isPair
    ? 'パートナーが立て替える定期の記録は、パートナーだけが編集できます。共有／個人は登録後に切り替えられません。'
    : '行をタップすると編集・削除できます。';
}

// 一覧のカード。並べ替え中は行末がハンドルになる。空なら 1 文だけ。
function PlannedList({
  items,
  isSorting,
  dayValueOf,
  onOpen,
  onReorder
}: {
  items: PlannedRecordListItem[];
  isSorting: boolean;
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
          disabled={!isSorting}
          items={items}
          onReorder={onReorder}
          renderItem={(item, { handleProps }) => (
            <PlannedRow
              dayValue={dayValueOf(item.dayClassificationId)}
              handle={
                isSorting ? <SortableHandle {...handleProps} /> : undefined
              }
              isFirst={item.id === items[0]?.id}
              isSorting={isSorting}
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
          isIncome ? 'text-primary' : 'text-foreground'
        )}
      >
        {formatSignedPrice(amount, !isIncome)}
      </span>
    </div>
  );
}

// 一覧の 1 行。編集できる行はボタン、並べ替え中とパートナーの立替行は押せない行。
function PlannedRow({
  item,
  dayValue,
  isFirst,
  isSorting,
  handle,
  onOpen
}: {
  item: PlannedRecordListItem;
  dayValue: number | null;
  isFirst: boolean;
  isSorting: boolean;
  handle?: React.ReactNode;
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
        className={cn(
          'font-semibold text-base',
          item.isPay ? 'text-foreground' : 'text-primary'
        )}
      >
        {formatSignedPrice(item.price, item.isPay)}
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
  if (isSorting) {
    return <ListCellStatic {...shared} trailing={handle} />;
  }
  return (
    <ListCellButton
      {...shared}
      aria-label={`毎月${dayValue ?? ''}日 ${title} を編集`}
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
