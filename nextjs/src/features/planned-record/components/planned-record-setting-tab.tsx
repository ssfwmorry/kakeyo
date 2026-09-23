'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { SwapButton } from '@/components/form/swap-button';
import { IconArrowDown, IconUpdate } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { RecordCard } from '@/features/record';
import { L } from '@/lib/shared/labels';
import { swapPlannedRecordAction } from '../actions';
import { plannedRecordLabels } from '../labels';
import type { GroupedPlannedRecordList, PlannedRecordListItem } from '../types';

// 設定「定期」タブ。定期一覧の表示・並べ替えのみを担い、編集は項目タップで
// note（定期編集）へ遷移する。setting 画面は他機能と共有されるため setting page が
// このタブを配置し、データ（一覧・ペアモード）は server で取得して渡す。ルート page は作らない。
//
// 一覧は record 一覧と同じ RecordCard で描く（設定の定期一覧にも
// RecordCard を使い、方法名/方法色/共有アイコン/定期アイコン/大きな金額＋円を
// 出していた）。左の開始月区分だけが定期固有の情報なので
// カードの外に添える。

type PlannedRecordSettingTabProps = {
  plannedRecordList: GroupedPlannedRecordList;
  // ペア共有モードか（個人 = false）。
  isPair: boolean;
};

export function PlannedRecordSettingTab({
  plannedRecordList,
  isPair
}: PlannedRecordSettingTabProps) {
  const [isEdit, setIsEdit] = useState(true);
  const router = useRouter();

  const items = isPair ? plannedRecordList.pair : plannedRecordList.self;

  return (
    <section className='flex flex-col gap-3'>
      <div className='flex items-center justify-between'>
        <h2 className='flex items-center gap-1.5 text-base font-medium'>
          <IconUpdate className='size-4 text-muted-foreground' aria-hidden />
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
          onEdit={() => router.push(`/note?plannedRecordId=${item.id}`)}
        />
      ))}
    </section>
  );
}

type PlannedRecordCardViewProps = {
  item: PlannedRecordListItem;
  isEdit: boolean;
  nextId?: number;
  onEdit: () => void;
};

function PlannedRecordCardView({
  item,
  isEdit,
  nextId,
  onEdit
}: PlannedRecordCardViewProps) {
  return (
    <div className='flex items-center gap-2'>
      {/* 開始月区分（毎月何日か）は定期固有。左カラムに固定幅で置く。 */}
      <span className='w-14 shrink-0 text-muted-foreground text-xs'>
        {item.dayClassificationName}
      </span>
      <div className='min-w-0 flex-1'>
        <RecordCard
          record={{
            ...item,
            // 定期そのものなので RecordCard の定期アイコンを必ず出す
            // （plannedRecordId は「定期由来か」の表示判定にのみ使われる）。
            plannedRecordId: item.id,
            // 立替は pairUserName（立替者）の有無で決まる。RecordCard の編集可否
            // 判定 resolveRecordEditable にこれを渡すことで、
            // （isSelf || (isPair && pairUserName == null)）と同じく「共有かつ
            // 相手が立替えた定期は編集させない」挙動になる。
            isInstead: item.pairUserName !== null,
            // 定期は実体化前の設定なので精算の概念を持たない。
            isSettlement: null
          }}
          onEdit={isEdit ? onEdit : undefined}
        />
      </div>
      {!isEdit && nextId !== undefined ? (
        <SwapButton
          prevId={item.id}
          nextId={nextId}
          action={swapPlannedRecordAction}
          label={plannedRecordLabels.swap.down}
          icon={<IconArrowDown className='size-4' />}
        />
      ) : null}
    </div>
  );
}
