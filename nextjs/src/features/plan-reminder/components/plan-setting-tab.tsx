'use client';

import { Separator } from '@/components/ui/separator';
import type { ColorClassification } from '@/features/master';
import type { GroupedPlanTypeList, GroupedReminderList } from '../types';
import { PlanTypeTab } from './plan-type-tab';
import { ReminderTab } from './reminder-tab';

// 設定「予定管理」タブ（Nuxt setting.vue の予定管理タブ相当）。
// 予定カテゴリ（PlanType）とリマインダー（PlanReminder）を縦に並べた 1 タブ分の
// コンポーネント。setting 画面は他レーンと共有されうるため、統合（P5）が
// setting page でこのコンポーネントを配置する。ルート page は本レーンでは作らない。
// データ（一覧・色マスタ・ペアモード）は統合側が server で取得して渡す。

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
