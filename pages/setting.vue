<template>
  <v-tabs v-model="tabMode" grow class="bg-blue-grey-lighten-4">
    <v-tab :value="tab.KAKEI">家計管理</v-tab>
    <v-tab :value="tab.PLAN">予定管理</v-tab>
    <v-tab :value="tab.OTHER">その他</v-tab>
  </v-tabs>
  <v-tabs-window v-model="tabMode" :touchless="true" class="h-100 bg-white">
    <v-tabs-window-item :value="tab.KAKEI" class="pt-2 px-2 page-tab-item">
      <SettingKakeiType :colorList="colorList" />
      <SettingKakeiMethod :colorList="colorList" />
      <SettingKakeiPlannedRecord />
    </v-tabs-window-item>
    <v-tabs-window-item :value="tab.KAKEI" class="pt-2 px-2 page-tab-item">
      <!-- <SettingPlanType :colorList="colorList" /> -->
    </v-tabs-window-item>
    <v-tabs-window-item :value="tab.KAKEI" class="pt-2 px-2 page-tab-item">
      <!-- <SettingGeneral /> -->
    </v-tabs-window-item>
  </v-tabs-window>
</template>

<script setup lang="ts">
import type { GetColorListRpc } from '@/types/common';

const { enableLoading, disableLoading } = useLoadingStore();
const loginStore = useLoginStore();
const { isDemoLogin } = storeToRefs(loginStore);
const { getColorList } = useSupabase();

const tab = {
  KAKEI: 1,
  PLAN: 2,
  OTHER: 3,
} as const;
type Tab = (typeof tab)[keyof typeof tab];
export type ColorList = GetColorListRpc[];

const tabMode = ref<Tab>(tab.KAKEI);
const colorList = ref<ColorList>([]);

// created
(async () => {
  enableLoading();

  const apiRes = await getColorList({ isDemoLogin: isDemoLogin.value });
  if (apiRes.data === null || apiRes.error !== null) return;
  colorList.value = apiRes.data;

  disableLoading();
})();
</script>
