<template>
  <v-tabs v-model="tabMode" grow class="bg-blue-grey-lighten-4">
    <v-tab :value="tab.KAKEI">家計管理</v-tab>
    <v-tab :value="tab.PLAN">予定管理</v-tab>
    <v-tab :value="tab.OTHER">その他</v-tab>
  </v-tabs>
  <v-tabs-window v-model="tabMode" :touchless="true" class="h-100 bg-white">
    <v-tabs-window-item :value="tab.KAKEI" class="pt-2 px-2 page-tab-item">
      <setting-KakeiType :colorList="colorList" />
      <setting-KakeiMethod :colorList="colorList" />
      <setting-KakeiBank v-if="!isPair" :colorList="colorList" />
      <setting-KakeiPlannedRecord />
    </v-tabs-window-item>
    <v-tabs-window-item :value="tab.PLAN" class="pt-2 px-2 page-tab-item">
      <setting-PlanType :colorList="colorList" />
      <setting-PlanReminder :colorList="colorList" />
    </v-tabs-window-item>
    <v-tabs-window-item :value="tab.OTHER" class="pt-2 px-2 page-tab-item">
      <setting-General />
    </v-tabs-window-item>
  </v-tabs-window>
</template>

<script setup lang="ts">
import type { ColorClassification } from '~/utils/types/model';

const { enableLoading, disableLoading } = useLoadingStore();
const { getColorClassificationList } = useSupabase();
const pairStore = usePairStore();
const { isPair } = storeToRefs(pairStore);

const tab = {
  KAKEI: 1,
  PLAN: 2,
  OTHER: 3,
} as const;
type Tab = (typeof tab)[keyof typeof tab];

const tabMode = ref<Tab>(tab.KAKEI);
const colorList = ref<ColorClassification[]>([]);

// created
(async () => {
  enableLoading();

  const apiRes = await getColorClassificationList();
  assertApiResponse(apiRes);
  colorList.value = apiRes.data;

  disableLoading();
})();
</script>
