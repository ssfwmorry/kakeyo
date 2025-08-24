<template>
  <div>
    <h4 class="mb-2">
      <v-icon size="small">{{ $ICONS.BELL }}</v-icon> リマインダ
    </h4>
    <div class="px-3 mb-4">
      <v-row
        v-for="(reminder, index) of reminderList[isPair ? 'pair' : 'self']"
        :key="reminder.id"
        no-gutters
        class="mb-3"
      >
        <v-col>
          <v-card variant="outlined" class="pa-1 card-border">
            <v-row no-gutters class="mb-1">
              <v-col cols="11" class="px-4 d-flex justify-start align-center">
                <v-btn
                  size="28"
                  dark
                  rounded="0"
                  variant="flat"
                  :class="`bg-${reminder.colorClassification.name}`"
                  class="mr-3 btn-icon text-white"
                  ><v-icon>{{ isPair ? $ICONS.SHARE : '' }}</v-icon> </v-btn
                >{{ reminder.name }}
              </v-col>
              <v-col cols="1" class="pr-4 d-flex justify-center align-center">
                <v-btn
                  :icon="$ICONS.TRASH"
                  variant="flat"
                  density="compact"
                  @click.stop="deleteApi(reminder)"
                ></v-btn>
              </v-col>
            </v-row>
            <v-divider class="mb-1" />

            <v-row v-if="reminder.memo" no-gutters class="pl-1">
              ・メモ: {{ reminder.memo }}
            </v-row>
            <v-row no-gutters class="pl-1"> ・リマインド日付: {{ reminder.date }} </v-row>
            <v-row no-gutters class="pl-1">
              ・チェック後の予定連携:
              {{ reminder.reminderType == ReminderType.stock ? 'あり' : 'なし' }}
            </v-row>
            <v-row no-gutters class="pl-1">
              ・次回リマインド条件:
              {{ reminder.baseType == BaseType.now ? 'チェック日' : 'リマインド日' }}
              から
              {{ reminder.condition.month }}ヶ月後
            </v-row>
          </v-card>
        </v-col>
      </v-row>
      <v-row no-gutters>
        <v-col class="d-flex justify-end">
          <v-btn
            variant="flat"
            rounded
            color="primary"
            height="32"
            width="70"
            @click="openCreateDialog()"
            >＋</v-btn
          >
        </v-col>
      </v-row>
    </div>

    <setting-ReminderDialog
      v-model="dialog"
      title="リマインダ名"
      :colorList="props.colorList"
      @close="closeDialog"
      @create="createApi()"
    />
  </div>
</template>

<script setup lang="ts">
import type { GetColorClassificationListOutput } from '~/api/supabase/colorClassification.interface';
import type {
  GetReminderListItem,
  GetReminderListOutputData,
} from '~/api/supabase/reminder.interface';
import { assertApiResponse } from '~/utils/api';
import { BaseType, ReminderType } from '~/utils/types/model';
import type { ReminderDialog, ReminderDialogNonNullable } from './ReminderDialog.vue';

const { enableLoading, disableLoading } = useLoadingStore();
const [authStore, pairStore] = [useAuthStore(), usePairStore()];
const { isDemoLogin, pairId, userUid } = storeToRefs(authStore);
const { deleteReminder, getReminderList, insertReminder } = useSupabase();
const { isPair } = storeToRefs(pairStore);
const { $ICONS } = useNuxtApp();
const { setToast } = useToastStore();

type Props = {
  colorList: GetColorClassificationListOutput['data'];
};
const props = defineProps<Props>();

const reminderList = ref<GetReminderListOutputData>({ self: [], pair: [], all: [] });
const dialog = ref<ReminderDialog>({
  isShow: false,
  name: null,
  reminderType: null,
  conditionMonth: null,
  baseType: null,
  date: null,
  colorId: null,
  memo: null,
});

const updateShowData = async () => {
  const apiRes = await getReminderList({ userUid: userUid.value, pairId: pairId.value });
  assertApiResponse(apiRes);
  reminderList.value = apiRes.data;
};
const openCreateDialog = () => {
  dialog.value = {
    isShow: true,
    name: null,
    reminderType: null,
    conditionMonth: null,
    baseType: null,
    date: null,
    colorId: null,
    memo: null,
  };
};
const closeDialog = () => {
  dialog.value.isShow = false;
};

const createApi = async () => {
  enableLoading();
  if (!validateCreateApi(dialog.value)) {
    alert('予期せぬ状態: bankDialog');
    return;
  }

  const auth = {
    isDemoLogin: isDemoLogin.value,
    userUid: userUid.value,
    isPair: isPair.value,
    pairId: pairId.value,
  };
  const payload = {
    ...dialog.value,
    colorClassificationId: dialog.value.colorId,
    condition: {
      month: dialog.value.conditionMonth,
    },
  };
  const apiRes = await insertReminder(auth, payload);
  assertApiResponse(apiRes);

  await updateShowData();
  disableLoading();
  setToast('登録しました');
  dialog.value.isShow = false;
};
// TODO 本日以前のdateを登録できないようにする
const validateCreateApi = (
  dialog: ReminderDialog
): dialog is ReminderDialogNonNullable & { memo: string | null } => {
  return !(
    dialog.name === null ||
    dialog.reminderType === null ||
    dialog.conditionMonth === null ||
    dialog.baseType === null ||
    dialog.date === null ||
    dialog.colorId === null
  );
};

const deleteApi = async (reminder: GetReminderListItem) => {
  const idOk = window.confirm('削除してもよろしいですか？');
  if (!idOk) return;

  enableLoading();
  const payload = { id: reminder.id };
  const apiRes = await deleteReminder({ isDemoLogin: isDemoLogin.value }, payload);
  assertApiResponse(apiRes);

  await updateShowData();
  disableLoading();
  setToast('削除しました');
};

// created
(async () => {
  await updateShowData();
})();

/**
- 美容室や歯医者が終わったら、次の予約の目安をしる。口座を一ヶ月ごとに記録したいのをリマインドする
- 超えたら通知アイコンでアラートする
  - reminders.dateが過去のものがあれば通知
  - アラートからチェックができるように
    - チェックをすると。todo_type=10の場合はplanを自動的に残す
    - dateを更新する
- カレンダー
  - planとtodoを合算して表示する
  - reminders由来のものは表示色を区別する
 */
</script>

<style scoped lang="scss">
.col-half:nth-child(even) {
  padding-left: 4px !important;
}
.col-half:nth-child(odd) {
  padding-right: 4px !important;
}
</style>
