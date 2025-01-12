<template>
  <v-tabs v-model="isAccountingTab" grow background-color="blue-grey lighten-4">
    <v-tab>家計管理</v-tab>
    <v-tab-item :value="0" class="pt-2 px-2 page-tab-item">
      <SettingKakeiType :colorList="colorList" />

      <SettingKakeiMethod :colorList="colorList" />

      <SettingKakeiPlannedRecord />
    </v-tab-item>

    <v-tab>予定管理</v-tab>
    <v-tab-item :value="1" class="pt-2 px-2 page-tab-item">
      <SettingPlanType :colorList="colorList" />
    </v-tab-item>

    <v-tab>その他</v-tab>
    <v-tab-item :value="2" class="pt-2 px-2 page-tab-item">
      <SettingGeneral />
    </v-tab-item>
  </v-tabs>
</template>

<script>
import { LOADING_TIMEOUT_TIME } from '@/plugins/constants';

export default {
  components: {
    RecordCard: () => import('@/components/RecordCard'),
    SettingGeneral: () => import('@/components/SettingGeneral'),
    SettingKakeiType: () => import('@/components/SettingKakeiType'),
    SettingKakeiMethod: () => import('@/components/SettingKakeiMethod'),
    SettingKakeiPlannedRecord: () => import('@/components/SettingKakeiPlannedRecord'),
    SettingPlanType: () => import('@/components/SettingPlanType'),
  },
  head() {
    return { title: ' | 設定' };
  },
  data() {
    return {
      isAccountingTab: 0,
      colorList: [],
    };
  },
  async created() {
    this.$store.commit('enableLoading');

    const apiRes = await this.$store.dispatch('supabase-api/getColorList');
    if (apiRes.error) {
      return;
    }
    this.colorList = apiRes.data;
  },
  mounted() {
    this.$nextTick(() => {
      setTimeout(() => this.$store.commit('disableLoading'), LOADING_TIMEOUT_TIME);
    });
  },
};
</script>
