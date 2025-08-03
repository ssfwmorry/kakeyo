<template>
  <div>
    <h4 class="mb-2">アカウント削除</h4>
    <div class="px-3">
      <p class="mb-1 fs-sm">
        <span class="text-red">アカウントに関するデータが全て消える</span>
        ので、以下に同意をしてください
      </p>
      <v-row no-gutters class="pl-1">
        <v-checkbox
          v-model="isShowReallyDelete"
          density="compact"
          hide-details
          label="消しても後悔しません"
          :disabled="isShowReallyDelete && isDeletable"
          class="pt-0 mt-0"
        ></v-checkbox>
      </v-row>
      <v-row v-if="isShowReallyDelete" no-gutters class="mt-1 pl-1">
        <v-checkbox
          v-model="isDeletable"
          density="compact"
          hide-details
          label="開発者にデータの復元を求めません"
          class="pt-0 mt-0"
        ></v-checkbox>
      </v-row>
      <v-row v-if="isShowReallyDelete && isDeletable" no-gutters class="mt-3 pl-8">
        <v-btn variant="flat" max-height="30" color="error" class="btn-action" @click="deleteUser">
          削除
        </v-btn>
      </v-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PAGE } from '~/utils/constants';

const { enableLoading, disableLoading } = useLoadingStore();
const { signOut, deleteUser: firebaseDeleteUser } = useFirebase();
const router = useRouter();
const { setToast } = useToastStore();

const isShowReallyDelete = ref(false);
const isDeletable = ref(false);

const deleteUser = async () => {
  enableLoading();

  await signOut();
  const apiRes = await firebaseDeleteUser();
  assertApiResponse(apiRes);

  disableLoading();
  setToast('アカウントを削除しました');
  router.push({ name: PAGE.LOGIN });
};
</script>
