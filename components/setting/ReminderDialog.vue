<template>
  <v-dialog
    :model-value="props.modelValue.isShow"
    :transition="false"
    max-width="600"
    @click:outside="closeDialog"
  >
    <v-card class="pa-4">
      <v-row no-gutters class="mb-2"> <h4>定期的な予定名</h4></v-row>
      <v-row no-gutters class="mb-3 px-2">
        <v-text-field
          v-model="props.modelValue.name"
          density="compact"
          hide-details
          ref="dialogTextField"
          placeholder="例：歯医者"
        ></v-text-field>
      </v-row>

      <div>
        <v-row no-gutters class="mb-2"> <h4>色の選択</h4></v-row>
        <v-row no-gutters class="mb-1">
          <v-col
            v-for="{ id, name } of colorList"
            :key="id"
            cols="2"
            class="px-1 mb-2 d-flex justify-center align-center"
          >
            <v-btn
              size="small"
              dark
              variant="flat"
              icon=""
              :color="name"
              @click="updateSelectedColorId(id)"
              >{{ props.modelValue.colorId === id ? '●' : '' }}</v-btn
            >
          </v-col>
        </v-row>
      </div>
      <v-row class="mb-4" no-gutters>
        <!-- メモ -->
        <v-text-field
          v-model="props.modelValue.memo"
          placeholder="メモ"
          variant="underlined"
          density="compact"
          hide-details
          :append-inner-icon="props.modelValue.memo !== null ? $ICONS.CLOSE : ''"
          @click:append-inner="props.modelValue.memo = null"
        />
      </v-row>

      <v-row no-gutters class="mb-2"> <h4>直近の日付</h4></v-row>
      <v-row no-gutters class="mb-2">
        <v-btn variant="flat" height="40" class="px-2 fw-nml fs-nml" color="grey-lighten-3">
          <v-icon size="30" color="grey-darken-1" class="pr-1">{{ $ICONS.CALENDAR }}</v-icon>
          {{ props.modelValue.date ?? '日付を選択' }}
          <v-menu
            v-model="isShowDatePicker"
            max-width="600"
            activator="parent"
            transition="scale-transition"
            :close-on-content-click="false"
          >
            <v-date-picker
              :model-value="props.modelValue.date"
              :display-value="props.modelValue.date"
              show-adjacent-months
              hide-header
              min="2000-01-01"
              max="2099-12-31"
              @update:model-value="setDate"
            ></v-date-picker>
          </v-menu>
        </v-btn>
      </v-row>

      <v-row no-gutters class="mb-2"> <h4>チェック後の予定連携</h4></v-row>
      <v-row no-gutters class="mb-2">
        <v-radio-group
          v-model="props.modelValue.reminderType"
          inline
          hide-details
          density="compact"
        >
          <v-radio label="あり" :value="ReminderType.stock"></v-radio>
          <v-radio label="なし" :value="ReminderType.flow"></v-radio>
        </v-radio-group>
      </v-row>

      <v-row no-gutters class="mb-2"> <h4>サイクル条件</h4></v-row>
      <v-row no-gutters class="mb-2">
        <v-radio-group v-model="props.modelValue.baseType" hide-details density="compact">
          <v-radio label="リマインドのチェック日" :value="BaseType.now"></v-radio>
          <v-radio label="リマインド日" :value="BaseType.date"></v-radio>
        </v-radio-group>
      </v-row>
      <v-row no-gutters class="mb-2 align-center">
        から、
        <v-select
          v-model="props.modelValue.conditionMonth"
          :items="MONTH_VALUES"
          hide-details
          disable-lookup
          single-line
          width="40"
          density="compact"
          variant="underlined"
        ></v-select>
        ヶ月後
      </v-row>

      <v-divider class="mb-3"></v-divider>
      <v-card-actions class="d-flex justify-end">
        <v-btn
          :loading="loading"
          variant="flat"
          width="80"
          color="primary"
          :disabled="isDisableDialogPostBtn()"
          class="ml-auto"
          @click="createApi()"
        >
          登録
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import type { GetColorClassificationListOutput } from '~/api/supabase/colorClassification.interface';
import { MONTH_VALUES } from '~/utils/constants';
import TimeUtility from '~/utils/time';
import type { DateString, Id, PickedDate } from '~/utils/types/common';
import { BaseType, type Condition, ReminderType } from '~/utils/types/model';

export type ReminderDialog = {
  isShow: boolean;
  name: string | null;
  reminderType: ReminderType | null;
  conditionMonth: Condition['month'] | null;
  baseType: BaseType | null;
  date: DateString | null;
  colorId: Id | null;
  memo: string | null;
};
export type ReminderDialogNonNullable = {
  [K in keyof ReminderDialog]: NonNullable<ReminderDialog[K]>;
};

type Props = {
  modelValue: ReminderDialog;
  title: string;
  colorList: GetColorClassificationListOutput['data'] | undefined;
};
const props = defineProps<Props>();
const emits = defineEmits(); // const emits = defineEmits(['prev', 'next', 'update']); とすると await emits()の型推論が効かなくなる

const loading = ref(false);
const isShowDatePicker = ref(false);

const setDate = (value: string | null) => {
  if (!value) return;
  props.modelValue.date = TimeUtility.GetPickedDateToDateStr(value as unknown as PickedDate);
  isShowDatePicker.value = false;
};

const closeDialog = () => {
  emits('close');
};
const updateSelectedColorId = (id: Id) => {
  props.modelValue.colorId = id;
};
const isDisableDialogPostBtn = () => {
  return (
    props.modelValue.name === null ||
    props.modelValue.reminderType === null ||
    props.modelValue.conditionMonth === null ||
    props.modelValue.baseType === null ||
    props.modelValue.date === null ||
    props.modelValue.colorId === null
  );
};
const createApi = async () => {
  loading.value = true;
  await emits('create');
  loading.value = false;
};
</script>
