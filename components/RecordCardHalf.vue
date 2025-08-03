<template>
  <v-card
    variant="outlined"
    :color="props.backgroundColor ?? undefined"
    class="d-flex flex-row card-border"
  >
    <v-sheet rounded :color="props.labelColor ?? undefined" width="6" class="d-flex"></v-sheet>
    <div class="py-2 pl-1 pr-2 w-100">
      <v-row no-gutters>
        <v-col class="d-flex justify-space-between">
          <div class="w-100 d-flex flex-row align-center justify-space-between">
            <div class="me-auto d-flex flex-row align-center">
              <div class="mr-2">
                <v-avatar
                  size="28"
                  :color="props.typeColor"
                  :icon="$ICONS.SHARE"
                  class="text-white"
                >
                </v-avatar>
              </div>
              <div class="fs-nml">
                {{ props.typeAndSubtype }}
                <v-icon v-if="props.isShowPlannedIcon" small>{{ $ICONS.UPDATE }}</v-icon>
              </div>
            </div>
            <div class="d-flex justify-end">
              {{ props.datetime ? TimeUtility.ConvertDbDatetimeStringToJPDay(props.datetime) : '' }}
            </div>
          </div>
        </v-col>
      </v-row>
      <v-row no-gutters>
        <div class="d-flex flex-grow-1 align-center pl-check">
          <v-icon v-if="props.isSettled === true" small color="green">{{ $ICONS.CHECK }}</v-icon>
        </div>
        <v-card-title
          class="pa-0 justify-end"
          :class="{ 'blue--text': props.isShowBlueColorPrice }"
        >
          {{ props.price }}
          <span class="fs-sm">円</span>
        </v-card-title>
      </v-row>
      <v-row no-gutters>
        <div class="pl-3 fs-sm">{{ props.memo }}</div>
      </v-row>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import TimeUtility from '~/utils/time';
import type { DbDatetimeString } from '~/utils/types/common';

const { $ICONS } = useNuxtApp();

type Props = {
  datetime: DbDatetimeString | null;
  labelColor: string | null;
  backgroundColor: string | null;
  typeColor: string;
  typeAndSubtype: string;
  isShowPlannedIcon: boolean;
  isSettled: boolean;
  memo: string;
  isShowBlueColorPrice: boolean;
  price: string;
};
const props = defineProps<Props>();
</script>
