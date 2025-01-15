<template>
  <v-dialog
    :model-value="props.modelValue.isShow"
    :transition="false"
    max-width="600"
    @click:outside="closeDialog"
  >
    <v-card class="pa-4">
      <v-row no-gutters class="mb-2">
        <h4 class="mx-auto">精算率選択（自分：相手）</h4>
      </v-row>
      <v-divider class="mb-2" />
      <v-row no-gutters class="">
        <v-col
          cols="6"
          v-for="i in [0, 10, 1, 9, 2, 8, 3, 7, 4, 6]"
          :key="i"
          class="pb-3 d-flex justify-center"
        >
          <v-btn
            variant="flat"
            :color="colorList[i]"
            width="90"
            height="40"
            class="text-white"
            @click="determineRate(i)"
          >
            {{ rateList[i] }}</v-btn
          >
        </v-col>
      </v-row>
      <v-row no-gutters class="mb-2 d-flex justify-center">
        <v-btn
          variant="flat"
          :color="colorList[5]"
          width="90"
          height="40"
          class="text-white"
          @click="determineRate(5)"
        >
          {{ rateList[5] }}</v-btn
        >
      </v-row>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { RATE_COLOR_LIST as colorList, RATE_LABEL_LIST as rateList } from '@/utils/constants';
const emits = defineEmits();

type Props = {
  modelValue: {
    isShow: boolean;
    id: number | null;
    isMe: boolean | null;
  };
};
const props = defineProps<Props>();

const closeDialog = () => {
  emits('closeDialog');
};
const determineRate = (index: number) => {
  const dialogInfo = {
    id: props.modelValue.id,
    isMe: props.modelValue.isMe,
    colorIndex: index,
  };
  emits('changeRate', dialogInfo);
};
</script>
