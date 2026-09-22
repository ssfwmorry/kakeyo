'use client';

import Link from 'next/link';
import { useState } from 'react';
import { SwapButton } from '@/components/form/swap-button';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { L } from '@/lib/shared/labels';
import { swapPlannedRecordAction } from '../actions';
import { colorHex } from '../color';
import { plannedRecordLabels } from '../labels';
import type { GroupedPlannedRecordList, PlannedRecordListItem } from '../types';

// 設定「定期」タブ（Nuxt KakeiPlannedRecord.vue 移植）。定期一覧の表示・並べ替えのみを
// 担い、編集は項目タップで note（定期編集）へ遷移する（fe-screens §SETTING）。
// setting 画面は他レーンと共有されるため統合（P5）が setting page でこのタブを配置し、
// データ（一覧・ペアモード）は統合側が server で取得して渡す。ルート page は作らない。

type PlannedRecordSettingTabProps = {
  plannedRecordList: GroupedPlannedRecordList;
  // ペア共有モードか（個人 = false）。getPairMode 由来を server から受ける。
  isPair: boolean;
};

export function PlannedRecordSettingTab({
  plannedRecordList,
  isPair
}: PlannedRecordSettingTabProps) {
  const [isEdit, setIsEdit] = useState(true);

  const items = isPair ? plannedRecordList.pair : plannedRecordList.self;

  return (
    <section className='flex flex-col gap-3'>
      <div className='flex items-center justify-between'>
        <h2 className='text-base font-medium'>
          {plannedRecordLabels.heading.plannedRecord}
        </h2>
        <Button
          type='button'
          size='sm'
          variant='outline'
          onClick={() => setIsEdit((prev) => !prev)}
        >
          {isEdit ? L.button.sort : L.button.edit}
        </Button>
      </div>

      {items.map((item, index) => (
        <PlannedRecordCardView
          key={item.id}
          item={item}
          isEdit={isEdit}
          nextId={items[index + 1]?.id}
        />
      ))}
    </section>
  );
}

type PlannedRecordCardViewProps = {
  item: PlannedRecordListItem;
  isEdit: boolean;
  nextId?: number;
};

function PlannedRecordCardView({
  item,
  isEdit,
  nextId
}: PlannedRecordCardViewProps) {
  // 金額は支出/収入の符号を付けて表示（旧一覧の見せ方に合わせる）。
  const amount = `${item.isPay ? '-' : '+'}${item.price.toLocaleString()}`;
  return (
    <Card>
      <CardHeader className='flex-row items-center justify-between gap-2'>
        <span className='flex items-center gap-2'>
          <span
            className='inline-block size-5 rounded-full'
            style={{
              backgroundColor: colorHex(item.typeColorClassificationName)
            }}
          />
          <span className='flex flex-col'>
            <span className='text-sm'>
              {item.dayClassificationName}・{item.typeName}
              {item.subTypeName ? ` ＞ ${item.subTypeName}` : ''}
            </span>
            <span className='text-xs text-muted-foreground'>
              {item.memo ?? ''} {amount}
            </span>
          </span>
        </span>
        {isEdit ? (
          // 編集は note（定期編集）へ遷移する（旧: 項目タップ → note）。
          // Button は asChild 非対応のため Link に buttonVariants を当てる。
          <Link
            href={`/note?plannedRecordId=${item.id}`}
            className={buttonVariants({ size: 'sm', variant: 'ghost' })}
          >
            {L.button.edit}
          </Link>
        ) : nextId !== undefined ? (
          <SwapButton
            prevId={item.id}
            nextId={nextId}
            action={swapPlannedRecordAction}
            label={plannedRecordLabels.swap.down}
            icon='↓'
          />
        ) : null}
      </CardHeader>
    </Card>
  );
}
