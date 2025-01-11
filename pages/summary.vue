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
import type { PieShowSetting } from '~/components/SummaryPie.vue';

const loginStore = useLoginStore();
const { isDemoLogin } = storeToRefs(loginStore);

// 1 から始まるnumberのみ許容される
const tab = {
  PIE: 1,
  BAR: 2,
  SETTLEMENT: 3,
} as const;
type Tab = (typeof tab)[keyof typeof tab];
const tabMode = ref<Tab>(tab.PIE);
const pieShowSetting = ref<PieShowSetting>({
  isPay: true,
  isType: true,
  isMonth: true,
  focus: TimeUtility.GetNowYearMonthObj(isDemoLogin.value),
});
const isExistPair = ref<boolean>(true);
const summaryBar = ref();
const summaryPie = ref();
const summarySettlement = ref();

const setPieShowSetting = ({ isPay, isType, isMonth, focus }: PieShowSetting) => {
  // records 画面からの遷移の場合は focus が yearMonthObj の形式となる
  if (!focus) return;
  pieShowSetting.value = { isPay, isType, isMonth, focus };
};

const changeTab = () => {
  switch (tabMode.value) {
    case tab.PIE:
      summaryPie.value?.updateChart();
      break;
    case tab.BAR:
      summaryBar.value?.updateChart();
      break;
    case tab.SETTLEMENT:
      summarySettlement.value?.updateChart();
      break;
    default:
      alert('呼ばれないはず');
      break;
  }
};

// created
(async () => {
  // pieShowSetting.value.focus = TimeUtility.GetNowYearMonthObj(isDemoLogin.value);
  // storeから取得
  // setPieShowSetting(route.params);
  // if (!this.$store.getters.pairId) this.isExistPair = false;
})();
</script>
