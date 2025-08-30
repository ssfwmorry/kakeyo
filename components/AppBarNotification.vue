<template>
  <div>
    <v-btn v-if="count > 0" icon size="small" @click="showDialog" class="pt-1">
      <v-badge color="red" :content="count"
        ><v-icon size="x-large" color="grey-darken-3" :icon="$ICONS.BELL" />
      </v-badge>
    </v-btn>
    <v-icon v-else color="grey-darken-3" :icon="$ICONS.BELL" />

    <v-dialog v-model="isShowDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h5">お知らせ</v-card-title>
        <div v-if="reminderList.length > 0">
          <v-card-text>
            <div v-for="reminder in reminderList" :key="reminder.id" class="mb-4">
              ・『{{ reminder.name }}』の日付が過ぎています。
              <v-btn
                color="primary"
                density="compact"
                variant="flat"
                :icon="$ICONS.CHECK"
                :loading="loading"
                @click="checkReminder(reminder)"
              />
            </div>
          </v-card-text>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import type { GetReminderListItem } from '~/api/supabase/reminder.interface';

const loadingStore = useLoadingStore();
const { enableLoading, disableLoading } = loadingStore;
const authStore = useAuthStore();
const { isDemoLogin, userUid, pairId } = storeToRefs(authStore);
const { $ICONS } = useNuxtApp();
const { getReminderList, checkReminder: supabaseCheckReminder } = useSupabase();
const { setToast } = useToastStore();

const isShowDialog = ref<boolean>(false);
const reminderList = ref<GetReminderListItem[]>([]);
const count = ref<number>(0);
const loading = ref(false);

const handleCheckNotifications = async () => {
  const payload = {
    userUid: userUid.value,
    pairId: pairId.value,
    isDemoLogin: isDemoLogin.value,
  };
  // reminder チェック
  const apiResReminder = await getReminderList(payload);
  assertApiResponse(apiResReminder);
  const today = dayjs().add(1, 'day');
  const filteredReminders = apiResReminder.data.all.filter((reminder) => {
    const reminderDate = dayjs(reminder.date);
    return reminderDate.isBefore(today, 'day'); // 今日以前
  });
  if (filteredReminders.length > 0) {
    count.value += filteredReminders.length;
    reminderList.value = filteredReminders;
  }
};

const showDialog = () => {
  isShowDialog.value = true;
};

const checkReminder = async (reminder: GetReminderListItem) => {
  enableLoading();
  loading.value = true;
  const payload = {
    isDemoLogin: isDemoLogin.value,
  };
  const apiRes = await supabaseCheckReminder(payload, reminder);
  assertApiResponse(apiRes);

  loading.value = false;
  setToast('確認しました');
  location.reload(); // 画面をリロード

  disableLoading();
};

// created
(async () => {
  await handleCheckNotifications();
})();
</script>
