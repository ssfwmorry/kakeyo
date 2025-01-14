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
        <v-icon class="mr-2">{{ $ICONS.CHART_PIE }}</v-icon
        >分類
      </v-tab>
      <v-tab :value="tab.BAR">
        <v-icon class="mr-2">{{ $ICONS.CHART_BAR }}</v-icon
        >推移
      </v-tab>
      <v-tab v-if="isExistPair" :value="tab.SETTLEMENT">
        <v-icon class="mr-2">{{ $ICONS.CASH }}</v-icon
        >精算
      </v-tab>
    </v-tabs>
    <v-tabs-window v-model="tabMode" :touchless="true">
      <v-tabs-window-item :value="tab.PIE" class="pt-2 px-2">
        <SummaryPie ref="summaryPie" :showSetting="pieShowSetting" />
      </v-tabs-window-item>
      <v-tabs-window-item :value="tab.BAR" class="pt-2 px-2">
        <SummaryBar ref="summaryBar" />
      </v-tabs-window-item>
      <v-tabs-window-item v-if="isExistPair" :value="tab.SETTLEMENT" class="pt-2 px-2">
        <SummarySettlement ref="summarySettlement" />
      </v-tabs-window-item>
    </v-tabs-window>
  </div>
</template>

<script setup lang="ts">
import TimeUtility from '@/utils/time';
import { routerParamKey, type SummaryQueryParam } from '@/utils/types/common';

const [loginStore, pairStore] = [useLoginStore(), usePairStore()];
const { isExistPair, isPair } = storeToRefs(pairStore);
const { isDemoLogin } = storeToRefs(loginStore);
const { routerParam } = useRouterParamStore();

// 1 から始まるnumberのみ許容される
const tab = {
  PIE: 1,
  BAR: 2,
  SETTLEMENT: 3,
} as const;
type Tab = (typeof tab)[keyof typeof tab];
const tabMode = ref<Tab>(tab.PIE);
const pieShowSetting = ref<SummaryQueryParam>({
  isPay: true,
  isType: true,
  isMonth: true,
  focus: TimeUtility.GetNowYearMonthObj(isDemoLogin.value),
});
const summaryBar = ref();
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
      await summaryBar.value?.updateChart();
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
  // storeから取得
  const param = routerParam(routerParamKey.SUMMARY_QUERY_PARAM) as SummaryQueryParam | null;
  if (param === null) return;
  setPieShowSetting(param);
})();
</script>
