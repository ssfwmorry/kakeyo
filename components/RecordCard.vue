<template>
  <v-card
    variant="outlined"
    :class="{ 'text--disabled grey-lighten-5': props.isDisable }"
    class="pa-1 card-border"
  >
    <v-row no-gutters>
      <v-col class="d-flex justify-space-between">
        <div class="d-flex flex-row align-center">
          <div class="mr-2">
            <v-avatar
              v-if="!props.isSettlement"
              size="28"
              :color="props.typeColor"
              :icon="props.isPairType ? $ICONS.SHARE : ''"
              class="text-white"
            ></v-avatar>
            <v-avatar
              v-else
              size="28"
              :color="props.typeColor"
              variant="outlined"
              :icon="$ICONS.SHARE"
            ></v-avatar>
          </div>
          <div class="fs-nml">
            {{ props.typeAndSubtype }}
            <v-icon v-if="props.isShowPlannedIcon" small>{{ $ICONS.UPDATE }}</v-icon>
          </div>
        </div>
        <div class="d-flex align-start">
          <v-btn
            v-if="props.isEnableEdit"
            :icon="$ICONS.PENCIL"
            density="compact"
            variant="flat"
            @click="editBtnFunc"
          >
          </v-btn>
        </div>
      </v-col>
    </v-row>
    <v-row no-gutters>
      <v-col cols="4" class="pl-1 pr-3 fs-sm d-flex flex-row align-center">
        <div>
          <v-row v-if="props.userName" no-gutters>
            <div class="fs-xsm">{{ props.userName }}</div>
          </v-row>
          <v-row no-gutters>
            <div class="pl-3" :class="`text-${props.methodColor}`">
              <v-icon v-if="props.isPairMethod" small>{{ $ICONS.SHARE }}</v-icon>
              {{ props.methodName }}
            </div>
          </v-row>
        </div>
      </v-col>
      <v-col cols="4" class="pl-3 my-1 fs-sm d-flex align-center col-border">
        <div>{{ props.memo }}</div>
      </v-col>
      <v-col cols="4">
        <v-card-title
          class="py-0 pr-2 fs-lg justify-end"
          :class="{ 'text-blue': props.isShowBlueColorPrice }"
        >
          {{ props.price }}
          <span class="fs-sm">円</span>
        </v-card-title>
      </v-col>
    </v-row>
  </v-card>
</template>

<script setup lang="ts">
const { $ICONS } = useNuxtApp();
const emits = defineEmits();

type Props = {
  isDisable: boolean;
  isPairType: boolean;
  isPairMethod: boolean;
  isShowPlannedIcon: boolean;
  isEnableEdit: boolean;
  isShowBlueColorPrice: boolean;
  isSettlement: boolean;
  typeColor: string;
  methodColor: string;
  methodName: string;
  typeAndSubtype: string;
  userName: string;
  memo: string;
  price: string;
};
const props = defineProps<Props>();

const editBtnFunc = () => {
  emits('edit');
};
</script>

<style scoped lang="scss">
.col-border {
  border-left: thin solid rgba(0, 0, 0, 0.12);
}
</style>
