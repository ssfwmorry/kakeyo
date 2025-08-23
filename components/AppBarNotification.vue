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
        <v-card-text>
          1ヶ月間、口座残高の登録をしていません。口座残高を登録してください。
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" text @click="isShowDialog = false">閉じる</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
const authStore = useAuthStore();
const { isDemoLogin, userUid } = storeToRefs(authStore);
const { $ICONS } = useNuxtApp();
const { haveLatestBankBalance } = useSupabase();

const isShowDialog = ref<boolean>(false);
const count = ref<number>(0);

const handleCheckNotifications = async () => {
  const payload = {
    userUid: userUid.value,
    isDemoLogin: isDemoLogin.value,
  };
  const apiRes = await haveLatestBankBalance(payload);
  assertApiResponse(apiRes);
  if (apiRes.data === false) {
    count.value += 1;
  }
};

const showDialog = () => {
  isShowDialog.value = true;
};

// created
(async () => {
  await handleCheckNotifications();
})();
</script>
