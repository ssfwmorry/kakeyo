<template>
  <div>
    <v-btn v-if="isShowAlert" color="warning" :icon="$ICONS.ALERT" @click="showAlert" />
  </div>
</template>

<script setup lang="ts">
const authStore = useAuthStore();
const { isDemoLogin, userUid } = storeToRefs(authStore);
const { $ICONS } = useNuxtApp();
const { setToast } = useToastStore();
const { haveLatestBankBalance } = useSupabase();

const isShowAlert = ref<boolean>(false);

const handleCheckLatestBankBalance = async () => {
  const payload = {
    userUid: userUid.value,
    isDemoLogin: isDemoLogin.value,
  };
  const apiRes = await haveLatestBankBalance(payload);
  assertApiResponse(apiRes);
  if (apiRes.data === false) {
    isShowAlert.value = true;
  }
};

const showAlert = () => {
  setToast('1ヶ月間、口座残高の登録をしていません。口座残高を登録してください。', 'warning');
};

// created
(async () => {
  await handleCheckLatestBankBalance();
})();
</script>
