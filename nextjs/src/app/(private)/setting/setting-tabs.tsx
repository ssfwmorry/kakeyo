'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { type BankItem, BankSettingTab } from '@/features/bank';
import type { ColorClassification } from '@/features/master';
import {
  type GroupedPlanTypeList,
  type GroupedReminderList,
  PlanSettingTab
} from '@/features/plan-reminder';
import {
  type GroupedPlannedRecordList,
  PlannedRecordSettingTab
} from '@/features/planned-record';
import {
  type GroupedMethodList,
  type GroupedTypeList,
  KakeiMethod,
  KakeiType
} from '@/features/type-method';
import { GeneralTab } from './general-tab';

// 設定画面の 3 タブ（家計管理 / 予定管理 / その他）を束ねる Client Component。
// fe-screens §SETTING のタブ構成に従う。各設定タブは各 feature の barrel から import し、
// データは Server Component（page.tsx）で取得済みのものを props で受け取るだけにする
// （このコンポーネントは配置とタブ切替のみを担い、fetch もドメインロジックも持たない）。

const settingTabsLabels = {
  kakei: '家計管理',
  plan: '予定管理',
  general: 'その他'
} as const;

type SettingTabsProps = {
  typeList: GroupedTypeList;
  methodList: GroupedMethodList;
  plannedRecordList: GroupedPlannedRecordList;
  // 口座は個人モード専用データ。ペア時は取得せず null を渡す（タブ内で非表示）。
  banks: BankItem[] | null;
  planTypeList: GroupedPlanTypeList;
  reminderList: GroupedReminderList;
  colors: ColorClassification[];
  // 共有モード（getPairMode）× ペアの有無（session.pairId）を解決済みの値。
  isPair: boolean;
};

export function SettingTabs({
  typeList,
  methodList,
  plannedRecordList,
  banks,
  planTypeList,
  reminderList,
  colors,
  isPair
}: SettingTabsProps) {
  return (
    <Tabs defaultValue='kakei' className='flex flex-col gap-4 p-4'>
      <TabsList>
        <TabsTrigger value='kakei'>{settingTabsLabels.kakei}</TabsTrigger>
        <TabsTrigger value='plan'>{settingTabsLabels.plan}</TabsTrigger>
        <TabsTrigger value='general'>{settingTabsLabels.general}</TabsTrigger>
      </TabsList>

      <TabsContent value='kakei' className='flex flex-col gap-6'>
        <KakeiType typeList={typeList} colors={colors} isPair={isPair} />
        <KakeiMethod methodList={methodList} colors={colors} isPair={isPair} />
        {/* 口座は非ペア（個人）モード時のみ表示する（fe-screens §SETTING）。 */}
        {banks !== null && <BankSettingTab banks={banks} colors={colors} />}
        <PlannedRecordSettingTab
          plannedRecordList={plannedRecordList}
          isPair={isPair}
        />
      </TabsContent>

      <TabsContent value='plan'>
        <PlanSettingTab
          planTypeList={planTypeList}
          reminderList={reminderList}
          colors={colors}
          isPair={isPair}
        />
      </TabsContent>

      <TabsContent value='general'>
        <GeneralTab />
      </TabsContent>
    </Tabs>
  );
}
