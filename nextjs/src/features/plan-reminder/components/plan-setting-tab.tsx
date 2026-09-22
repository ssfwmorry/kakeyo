'use client';

import { Separator } from '@/components/ui/separator';
import type { ColorClassification } from '@/features/master';
import type { GroupedPlanTypeList, GroupedReminderList } from '../types';
import { PlanTypeTab } from './plan-type-tab';
import { ReminderTab } from './reminder-tab';

// 設定「予定管理」タブ。予定カテゴリ（PlanType）とリマインダー（PlanReminder）を
// 縦に並べた 1 タブ分のコンポーネント。setting 画面は他機能と共有されうるため
// ルート page は持たず、setting page 側がこのコンポーネントを配置する。
// データ（一覧・色マスタ・ペアモード）は server で取得して渡す。

type PlanSettingTabProps = {
  planTypeList: GroupedPlanTypeList;
  reminderList: GroupedReminderList;
  colors: ColorClassification[];
  isPair: boolean;
};

export function PlanSettingTab({
  planTypeList,
  reminderList,
  colors,
  isPair
}: PlanSettingTabProps) {
  return (
    <div className='flex flex-col gap-6'>
      <PlanTypeTab
        planTypeList={planTypeList}
        colors={colors}
        isPair={isPair}
      />
      <Separator />
      <ReminderTab
        reminderList={reminderList}
        colors={colors}
        isPair={isPair}
      />
    </div>
  );
}
