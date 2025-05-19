<template>
  <div class="h-100 bg-white">
    <v-tabs
      v-model="tabMode"
      grow
      density="comfortable"
      bg-color="blue-grey-lighten-4"
      @update:model-value="changeTab"
    >
      <v-tab :value="tab.PIE">
        <v-icon class="mr-2">{{ $ICONS.CHART_PIE }}</v-icon> 内訳
      </v-tab>
      <v-tab :value="tab.BAR">
        <v-icon class="mr-2">{{ $ICONS.CHART_BAR }}</v-icon> 推移
      </v-tab>
      <v-tab v-if="isExistPair" :value="tab.SETTLEMENT">
        <v-icon class="mr-2">{{ $ICONS.CASH }}</v-icon> 精算
      </v-tab>
    </v-tabs>
    <v-tabs-window v-model="tabMode" :touchless="true">
      <v-tabs-window-item :value="tab.PIE" class="pt-2 px-2">
        <SummaryPie ref="summaryPie" :showSetting="pieShowSetting" />
      </v-tabs-window-item>
      <v-tabs-window-item :value="tab.BAR" class="pt-1">
        <v-tabs
          v-model="tabModeBar"
          grow
          density="comfortable"
          bg-color="blue-grey-lighten-4"
          @update:model-value="changeTab"
        >
          <v-tab :value="tabBar.PAY_AND_INCOME">
            <v-icon class="mr-2">{{ $ICONS.SWAP_VERTICAL_BOLD }}</v-icon> 全体
          </v-tab>
          <v-tab :value="tabBar.TYPE">
            <v-icon class="mr-2">{{ $ICONS.SHAPE }}</v-icon> カテゴリ別
          </v-tab>
        </v-tabs>
        <v-tabs-window v-model="tabModeBar" :touchless="true">
          <v-tabs-window-item :value="tabBar.PAY_AND_INCOME" class="pt-2 px-2">
            <SummaryBar ref="summaryBar" />
          </v-tabs-window-item>
          <v-tabs-window-item :value="tabBar.TYPE" class="pt-2 px-2">
            <SummaryBarType ref="summaryBarType" />
          </v-tabs-window-item>
        </v-tabs-window>
      </v-tabs-window-item>
      <v-tabs-window-item v-if="isExistPair" :value="tab.SETTLEMENT" class="pt-2 px-2">
        <SummarySettlement ref="summarySettlement" />
      </v-tabs-window-item>
    </v-tabs-window>
  </div>
</template>

<script setup lang="ts">
import TimeUtility from '@/utils/time';
import { RouterParamKey, type SummaryQueryParam } from '@/utils/types/page';

const [authStore, pairStore] = [useAuthStore(), usePairStore()];
const { isPair } = storeToRefs(pairStore);
const { isDemoLogin, isExistPair } = storeToRefs(authStore);
const { routerParam } = useRouterParamStore();

// 1 から始まるnumberのみ許容される
const tab = {
  PIE: 1,
  BAR: 2,
  SETTLEMENT: 3,
} as const;
type Tab = (typeof tab)[keyof typeof tab];
const tabMode = ref<Tab>(tab.PIE);
const tabBar = {
  PAY_AND_INCOME: 1,
  TYPE: 2,
} as const;
type TabBar = (typeof tab)[keyof typeof tab];
const tabModeBar = ref<TabBar>(tabBar.PAY_AND_INCOME);
const pieShowSetting = ref<SummaryQueryParam>({
  isPay: true,
  isType: true,
  isMonth: true,
  focus: TimeUtility.GetNowYearMonthObj(isDemoLogin.value),
});
const summaryBar = ref();
const summaryBarType = ref();
const summaryPie = ref();
const summarySettlement = ref();

const setPieShowSetting = ({ isPay, isType, isMonth, focus }: SummaryQueryParam) => {
  // records 画面からの遷移の場合は focus が yearMonthObj の形式となる
  if (!focus) return;
  pieShowSetting.value = { isPay, isType, isMonth, focus };
};
const updateChart = async (isEnableSettlementUpdate: boolean) => {
  switch (tabMode.value) {
    case tab.PIE:
      await summaryPie.value?.updateChart();
      break;
    case tab.BAR:
      switch (tabModeBar.value) {
        case tabBar.PAY_AND_INCOME:
          await summaryBar.value?.updateChart();
          break;
        case tabBar.TYPE:
          await summaryBarType.value?.resetTypeList();
          break;
        default:
          alert('呼ばれないはず');
          break;
      }
      break;
    case tab.SETTLEMENT:
      if (isEnableSettlementUpdate) await summarySettlement.value?.updateChart();
      break;
    default:
      alert('呼ばれないはず');
      break;
  }
};
const changeTab = async () => {
  await updateChart(true);
};

watch(isPair, async (newValue, oldValue) => {
  await updateChart(false);
});

// created
(async () => {
  const param = routerParam<SummaryQueryParam>(RouterParamKey.SUMMARY_QUERY_PARAM);
  if (param === null) return;
  setPieShowSetting(param);
})();
</script>
