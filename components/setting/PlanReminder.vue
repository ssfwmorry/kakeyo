<template>
  <div>
    <h4 class="mb-2">
      <v-icon size="small">{{ $ICONS.BELL }}</v-icon> 定期的な予定
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
                  dark
                  size="28"
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
                  @click.stop="handleDelete(reminder)"
                ></v-btn>
              </v-col>
            </v-row>
            <v-divider class="mb-1" />

            <v-row v-if="reminder.memo" no-gutters class="pl-1">
              ・メモ: {{ reminder.memo }}
            </v-row>
            <v-row no-gutters class="pl-1"> ・直近の日付：{{ reminder.date }} </v-row>
            <v-row no-gutters class="pl-1">
              ・チェック後に予定として：
              {{ reminder.reminderType == ReminderType.stock ? '残す' : '残さない' }}
            </v-row>
            <v-row
              v-if="reminder.condition.conditionType === ConditionType.month"
              no-gutters
              class="pl-1"
            >
              ・次の予定：
              {{ reminder.condition.baseType == BaseType.now ? 'チェック日' : 'リマインド日' }}
              から
              {{ reminder.condition.month }}ヶ月後
            </v-row>
            <v-row v-else no-gutters class="pl-1">
              ・次の予定：来年の
              {{ TimeUtility.ConvertMonthDayToJPMonthDay(reminder.condition.monthDay) }}
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

    <setting-PlanReminderDialog
      v-model="dialog"
      title="定期的な予定"
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
import TimeUtility from '~/utils/time';
import { BaseType, ConditionType, ReminderType } from '~/utils/types/model';
import type { ReminderDialog, ReminderDialogNonNullable } from './PlanReminderDialog.vue';

const initialDialog = () => ({
  isShow: false,
  name: null,
  reminderType: null,
  conditionType: ConditionType.month,
  conditionBaseType: null,
  conditionMonth: null,
  conditionMonthDay: null,
  date: null,
  colorId: null,
  memo: null,
});

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
const dialog = ref<ReminderDialog>(initialDialog());

const updateShowData = async () => {
  const apiRes = await getReminderList({ userUid: userUid.value, pairId: pairId.value });
  assertApiResponse(apiRes);
  reminderList.value = apiRes.data;
};
const openCreateDialog = () => {
  dialog.value = { ...initialDialog(), isShow: true };
};
const closeDialog = () => {
  dialog.value = initialDialog();
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
      conditionType: dialog.value.conditionType,
      month: dialog.value.conditionMonth,
      monthDay: dialog.value.conditionMonthDay,
      baseType: dialog.value.conditionBaseType,
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
  // TODO: 任意条件をダイアログのロジックと共通化させる
  return !(
    dialog.name === null ||
    dialog.reminderType === null ||
    dialog.date === null ||
    dialog.colorId === null
  );
};

const handleDelete = async (reminder: GetReminderListItem) => {
  const idOk = window.confirm('予定への連携もなくなります。\n本当に削除してもよいですか？');
  if (!idOk) return;

  enableLoading();
  const payload = { reminderId: reminder.id, conditionId: reminder.conditionId };
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
</script>

<style scoped lang="scss">
.col-half:nth-child(even) {
  padding-left: 4px !important;
}
.col-half:nth-child(odd) {
  padding-right: 4px !important;
}
</style>
