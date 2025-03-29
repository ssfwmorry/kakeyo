<template>
  <div>
    <h4 class="mb-2">方法</h4>
    <div class="px-3 mb-4">
      <v-row no-gutters class="mb-3">
        <v-col class="d-flex flex-row">
          <v-btn-toggle v-model="isPay" density="compact" variant="outlined" mandatory>
            <v-btn :value="true" width="70" class="px-0">支払</v-btn>
            <v-btn :value="false" min-width="70" class="px-0">受取</v-btn>
          </v-btn-toggle>
          <div class="ml-4 d-flex align-center">
            <v-btn
              size="x-small"
              variant="outlined"
              :icon="isEdit ? $ICONS.SWAP_VERTICAL : $ICONS.PENCIL"
              @click="isEdit = !isEdit"
            ></v-btn>
          </div>
        </v-col>
      </v-row>
      <v-row class="mb-3" no-gutters>
        <v-col
          v-for="(method, methodIndex) of methodList[isPay ? 'pay' : 'income'][
            isPair ? 'pair' : 'self'
          ]"
          :key="method.id"
          cols="6"
          class="mb-2 col-method"
        >
          <v-card variant="outlined" class="pa-2 d-flex align-center card-border" min-height="54">
            <v-row no-gutters class="">
              <v-col
                cols="10"
                class="d-flex align-center"
                :class="`text-${method.colorClassificationName}`"
              >
                {{ method.name }}
              </v-col>
              <v-col cols="2" class="d-flex justify-center align-center">
                <v-btn
                  v-if="isEdit"
                  density="compact"
                  variant="flat"
                  :icon="$ICONS.PENCIL"
                  @click.stop="openEditDialog(method)"
                ></v-btn>
                <v-btn
                  v-else-if="
                    !isEdit &&
                    methodIndex <
                      methodList[isPay ? 'pay' : 'income'][isPair ? 'pair' : 'self'].length - 1
                  "
                  density="compact"
                  variant="flat"
                  :icon="methodIndex % 2 === 0 ? $ICONS.ARROW_RIGHT : $ICONS.ARROW_BOTTOM_LEFT"
                  @click.stop="
                    swapSort(
                      method.id,
                      methodList[isPay ? 'pay' : 'income'][isPair ? 'pair' : 'self'][
                        methodIndex + 1
                      ].id
                    )
                  "
                ></v-btn>
                <v-btn v-else :icon="''" density="compact" variant="flat"></v-btn>
              </v-col>
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

    <SettingDialog
      v-model="methodDialog"
      title="方法名"
      :colorList="props.colorList"
      @closeDialog="closeDialog"
      @upsert="upsertApi()"
      @delete="deleteApi()"
    />
  </div>
</template>

<script setup lang="ts">
import type { GetColorClassificationListOutput } from '@/api/supabase/colorClassification.interface';
import type { GetMethodListItem, GetMethodListOutput } from '@/api/supabase/method.interface';
import type { TypeDialog } from '@/components/SettingKakeiType.vue';
import type { Id } from '@/utils/types/common';

const { enableLoading, disableLoading } = useLoadingStore();
const [authStore, pairStore] = [useAuthStore(), usePairStore()];
const { isDemoLogin, pairId, userUid } = storeToRefs(authStore);
const { isPair } = storeToRefs(pairStore);
const { $ICONS } = useNuxtApp();
const { deleteMethod, getMethodList, swapMethod, upsertMethod } = useSupabase();
const { setToast } = useToastStore();

type Props = {
  colorList: GetColorClassificationListOutput['data'];
};
const props = defineProps<Props>();

type MethodDialog = TypeDialog;
const isPay = ref(true);
const isEdit = ref(true);
const methodList = ref<GetMethodListOutput['data']>({
  income: { self: [], pair: [] },
  pay: { self: [], pair: [] },
});
const methodDialog = ref<MethodDialog>({
  isShow: false,
  isWithColor: true,
  id: null,
  name: null,
  colorId: null,
});

const updateShowData = async () => {
  const apiRes = await getMethodList({
    isDemoLogin: isDemoLogin.value,
    userUid: userUid.value,
  });
  if (apiRes.error != null) {
    alert(apiRes.message + `(Error: ${JSON.stringify(apiRes.error)})`);
    return;
  }
  methodList.value = apiRes.data;
};
const openCreateDialog = () => {
  methodDialog.value = {
    isShow: true,
    isWithColor: true,
    id: null,
    name: null,
    colorId: null,
  };
};
const openEditDialog = ({ id, name, colorClassificationId }: GetMethodListItem) => {
  methodDialog.value = {
    isShow: true,
    isWithColor: true,
    id: id,
    name: name,
    colorId: colorClassificationId,
  };
};
const closeDialog = () => {
  methodDialog.value.isShow = false;
};
const upsertApi = async () => {
  enableLoading();
  if (!validateUpsertApi(methodDialog.value)) {
    alert('予期せぬ状態: methodDialog');
    return;
  }

  const auth = {
    isDemoLogin: isDemoLogin.value,
    userUid: userUid.value,
    isPair: isPair.value,
    pairId: pairId.value,
  };
  const payload = {
    id: methodDialog.value.id,
    name: methodDialog.value.name,
    isPay: isPay.value,
    colorId: methodDialog.value.colorId,
  };
  const apiRes = await upsertMethod(auth, payload);
  if (apiRes.error !== null) {
    alert(apiRes.message + `(Error: ${JSON.stringify(apiRes.error)})`);
    return;
  }

  await updateShowData();
  disableLoading();
  setToast(methodDialog.value.id ? '変更しました' : '登録しました');
  methodDialog.value.isShow = false;
};
const validateUpsertApi = (
  dialog: MethodDialog
): dialog is MethodDialog & { name: string; colorId: Id } => {
  return dialog.name != null && dialog.colorId !== null;
};
const deleteApi = async () => {
  enableLoading();
  if (methodDialog.value.id === null) {
    alert('予期せぬ状態: methodDialog');
    return;
  }

  const payload = { id: methodDialog.value.id };
  const apiRes = await deleteMethod({ isDemoLogin: isDemoLogin.value }, payload);
  if (apiRes.error !== null) {
    if (apiRes.error.code === '23503') {
      setToast('紐づくデータがあるので削除できません', 'error');
    } else {
      alert(apiRes.message + `(Error: ${JSON.stringify(apiRes.error)})`);
    }
    return;
  }

  await updateShowData();
  disableLoading();
  setToast('削除しました');
  methodDialog.value.isShow = false;
};
const swapSort = async (prevId: Id, nextId: Id) => {
  enableLoading();
  const payload = { prevId: prevId, nextId: nextId };
  const apiRes = await swapMethod({ isDemoLogin: isDemoLogin.value }, payload);
  if (apiRes.error !== null) {
    alert(apiRes.message + `(Error: ${JSON.stringify(apiRes.error)})`);
    return;
  }

  await updateShowData();
  disableLoading();
  setToast('入れ替えました');
};

// created
(async () => {
  await updateShowData();
})();
</script>

<style scoped lang="scss">
.col-method:nth-child(even) {
  padding-left: 4px !important;
}
.col-method:nth-child(odd) {
  padding-right: 4px !important;
}
</style>
