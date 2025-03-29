<template>
  <v-dialog
    :model-value="modelValue.isShow"
    :transition="false"
    max-width="600"
    @click:outside="closeDialog"
  >
    <v-card class="pa-4">
      <v-row no-gutters class="mb-2">
        <h4>{{ title }}</h4></v-row
      >
      <v-row no-gutters class="mb-3 px-2">
        <v-text-field
          v-model="modelValue.name"
          density="compact"
          hide-details
          ref="dialogTextField"
          placeholder="例：その他"
        ></v-text-field>
      </v-row>
      <div v-if="modelValue.isWithColor">
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
              >{{ modelValue.colorId === id ? '●' : '' }}</v-btn
            >
          </v-col>
        </v-row>
      </div>
      <v-divider class="mb-3"></v-divider>
      <v-card-actions class="d-flex justify-space-between">
        <v-btn v-if="modelValue.id !== null" variant="flat" color="error" @click="deleteApi()">
          <v-icon>{{ $ICONS.TRASH }}</v-icon>
        </v-btn>
        <v-btn
          :loading="loading"
          variant="flat"
          width="80"
          color="primary"
          :disabled="isDisableDialogPostBtn()"
          class="ml-auto"
          @click="upsertApi()"
        >
          {{ modelValue.id === null ? '登録' : '変更' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import type { GetColorClassificationListOutput } from '@/api/supabase/colorClassification.interface';
import type { SubTypeDialog, TypeDialog } from '@/components/SettingKakeiType.vue';
import type { Id } from '@/utils/types/common';

type Props = {
  modelValue: TypeDialog | SubTypeDialog;
  title: string;
  colorList: GetColorClassificationListOutput['data'] | undefined;
};
const props = defineProps<Props>();
const emits = defineEmits();

const loading = ref(false);

const closeDialog = () => {
  emits('closeDialog');
};
const updateSelectedColorId = (id: Id) => {
  (props.modelValue as TypeDialog).colorId = id;
};
const isDisableDialogPostBtn = () => {
  if (props.modelValue.isWithColor) {
    return props.modelValue.name === null || props.modelValue.colorId === null;
  } else {
    return props.modelValue.name === null;
  }
};
const upsertApi = async () => {
  loading.value = true;
  await emits('upsert');
  loading.value = false;
};
const deleteApi = async () => {
  await emits('delete');
};
</script>
