<template>
  <v-row no-gutters>
    <v-col>
      <v-toolbar flat color="white" height="55">
        <v-spacer />
        <v-btn variant="text" class="fs-lg" icon="" @click="prevFunc"> ＜ </v-btn>
        <v-spacer />
        <v-btn
          variant="flat"
          height="48"
          class="px-4 py-1 text-center d-block"
          :class="{ 'btn-disabled': props.mode === 'YEAR' }"
        >
          <div>
            <h4>{{ title }}</h4>
            <h5>{{ props.subtitle }}</h5>
          </div>
          <v-menu
            v-model="isShowMonthPicker"
            max-width="600"
            activator="parent"
            transition="scale-transition"
            :close-on-content-click="false"
            @update:model-value="handleMenu"
          >
            <v-card v-if="menuMode == MenuMode.year" class="py-2">
              <v-date-picker-years
                v-model="year"
                min="2024-01-01"
                hide-header
                view-mode="months"
                class="bg-white"
                @update:model-value="handleYear"
            /></v-card>
            <v-card v-if="menuMode == MenuMode.month" class="py-2"
              ><v-date-picker-months
                v-model="month"
                hide-header
                view-mode="months"
                class="bg-white"
                @update:model-value="handleMonth"
            /></v-card>
          </v-menu>
        </v-btn>
        <v-spacer />
        <v-btn variant="text" class="fs-lg" icon="" @click="nextFunc"> ＞ </v-btn>
        <v-spacer />
      </v-toolbar>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import TimeUtility from '@/utils/time';
import type { YearMonthNumObj } from '@/utils/types/common';

const emits = defineEmits(['prev', 'next', 'update']);
type Props = {
  mode: 'YEAR' | 'MONTH';
  subtitle: string;
  focus: YearMonthNumObj | null;
};
const props = defineProps<Props>();
const MenuMode = {
  closed: 0,
  year: 1,
  month: 2,
} as const;
type MenuMode = (typeof MenuMode)[keyof typeof MenuMode];

const isShowMonthPicker = ref(false);
const menuMode = ref<MenuMode>(MenuMode.closed);
const year = ref<number | undefined>();
const month = ref<number | undefined>();

const title = computed(() => {
  if (props.focus === null) return '　';
  else {
    if (props.mode === 'MONTH') return TimeUtility.ConvertYearMonthNumObjToJPYearMonth(props.focus);
    else return `${props.focus.year}年`;
  }
});

const handleMenu = () => {
  if (!isShowMonthPicker.value || props.focus === null) return;
  year.value = props.focus.year;
  month.value = props.focus.month;
  menuMode.value = MenuMode.year;
};
const handleYear = () => {
  if (props.mode === 'YEAR') {
    // ボタンがdisabledなので呼ばれる想定ではないが実装しておく
    emits('update', { year: year.value, month: month.value });
    menuMode.value = MenuMode.closed;
    isShowMonthPicker.value = false;
    return;
  }
  menuMode.value = MenuMode.month;
};
const handleMonth = () => {
  emits('update', { year: year.value, month: month.value });
  menuMode.value = MenuMode.closed;
  isShowMonthPicker.value = false;
};

const prevFunc = () => {
  emits('prev');
};
const nextFunc = () => {
  emits('next');
};
</script>

<style scoped lang="scss">
.btn-disabled {
  pointer-events: none;
}
</style>
