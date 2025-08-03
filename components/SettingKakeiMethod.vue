<template>
  <div>
    <h4 class="mb-2">
      <v-icon size="small">{{ $ICONS.CREDIT_CARD }}</v-icon> 方法
    </h4>
    <div class="px-3 mb-4">
      <v-row no-gutters class="mb-3">
        <v-col class="d-flex flex-row">
          <v-btn-toggle v-model="payMode" density="compact" variant="outlined" mandatory>
            <v-btn :value="PayMode.pay" width="70" class="px-0">支払</v-btn>
            <v-btn :value="PayMode.income" min-width="70" class="px-0">受取</v-btn>
            <v-btn v-if="isPair" :value="PayMode.both" min-width="70" class="px-0">精算</v-btn>
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
          v-for="(method, methodIndex) of methodList[payMode][isPair ? 'pair' : 'self']"
          :key="method.id"
          cols="6"
          class="mb-2 col-half"
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
                    methodIndex < methodList[payMode][isPair ? 'pair' : 'self'].length - 1
                  "
                  density="compact"
                  variant="flat"
                  :icon="methodIndex % 2 === 0 ? $ICONS.ARROW_RIGHT : $ICONS.ARROW_BOTTOM_LEFT"
                  @click.stop="
                    swapSort(
                      method.id,
                      methodList[payMode][isPair ? 'pair' : 'self'][methodIndex + 1].id
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
            :disabled="payMode === PayMode.both && !isPair"
            @click="openCreateDialog()"
            >＋</v-btn
          >
        </v-col>
      </v-row>
    </div>

    <SettingDialog
      v-model="dialog"
      title="方法名"
      :colorList="props.colorList"
      @closeDialog="closeDialog"
      @upsert="upsertApi()"
      @delete="deleteApi()"
    />
  </div>
</template>

<script setup lang="ts">
import type { GetColorClassificationListOutput } from '~/api/supabase/colorClassification.interface';
import { PostgrestErrorCode } from '~/api/supabase/common.interface';
import type { GetMethodListItem, GetMethodListOutputData } from '~/api/supabase/method.interface';
import { assertApiResponse } from '~/utils/api';
import type { Id } from '~/utils/types/common';
import type { NameAndColorDialog } from './SettingDialog.vue';

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

const PayMode = {
  pay: 'pay',
  income: 'income',
  both: 'both',
} as const;
type PayMode = (typeof PayMode)[keyof typeof PayMode];

const payMode = ref<PayMode>(PayMode.pay);
const isPay = computed<boolean | null>(() =>
  payMode.value === PayMode.both ? null : payMode.value === PayMode.pay
);
const isEdit = ref(true);
const methodList = ref<GetMethodListOutputData>({
  income: { self: [], pair: [] },
  pay: { self: [], pair: [] },
  both: { self: [], pair: [] },
});
const dialog = ref<NameAndColorDialog>({
  isShow: false,
  isWithColor: true,
  id: null,
  name: null,
  colorId: null,
  isHasColor: true,
});

const updateShowData = async () => {
  const apiRes = await getMethodList({ userUid: userUid.value });
  assertApiResponse(apiRes);
  methodList.value = apiRes.data;
};
const openCreateDialog = () => {
  dialog.value = {
    isShow: true,
    isWithColor: true,
    id: null,
    name: null,
    colorId: null,
    isHasColor: true,
  };
};
const openEditDialog = ({ id, name, colorClassificationId }: GetMethodListItem) => {
  dialog.value = {
    isShow: true,
    isWithColor: true,
    id,
    name: name,
    colorId: colorClassificationId,
    isHasColor: true,
  };
};
const closeDialog = () => {
  dialog.value.isShow = false;
};

const upsertApi = async () => {
  enableLoading();
  if (!validateUpsertApi(dialog.value)) {
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
    id: dialog.value.id,
    name: dialog.value.name,
    isPay: isPay.value,
    colorId: dialog.value.colorId,
  };
  const apiRes = await upsertMethod(auth, payload);
  assertApiResponse(apiRes);

  await updateShowData();
  disableLoading();
  setToast(dialog.value.id ? '変更しました' : '登録しました');
  dialog.value.isShow = false;
};
const validateUpsertApi = (
  dialog: NameAndColorDialog
): dialog is NameAndColorDialog & { name: string; colorId: Id } => {
  return dialog.name != null && dialog.colorId !== null;
};
const deleteApi = async () => {
  enableLoading();
  if (dialog.value.id === null) {
    alert('予期せぬ状態: methodDialog');
    return;
  }

  const payload = { id: dialog.value.id };
  const apiRes = await deleteMethod({ isDemoLogin: isDemoLogin.value }, payload);
  if (apiRes.error !== null) {
    if (apiRes.error.code === PostgrestErrorCode.FOREIGN_KEY) {
      setToast('紐づくデータがあるので削除できません', 'error');
    } else {
      assertApiResponse(apiRes);
    }
    return;
  }

  await updateShowData();
  disableLoading();
  setToast('削除しました');
  dialog.value.isShow = false;
};
const swapSort = async (prevId: Id, nextId: Id) => {
  enableLoading();
  const payload = { prevId: prevId, nextId: nextId };
  const apiRes = await swapMethod({ isDemoLogin: isDemoLogin.value }, payload);
  assertApiResponse(apiRes);

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
.col-half:nth-child(even) {
  padding-left: 4px !important;
}
.col-half:nth-child(odd) {
  padding-right: 4px !important;
}
</style>
