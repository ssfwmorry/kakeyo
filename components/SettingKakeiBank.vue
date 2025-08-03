<template>
  <div>
    <h4 class="mb-2">
      <v-icon size="small">{{ $ICONS.BANK }}</v-icon> 口座
    </h4>
    <div class="px-3 mb-4">
      <v-row class="mb-3" no-gutters>
        <v-col v-for="bank of bankList" :key="bank.id" cols="6" class="mb-2 col-half">
          <v-card variant="outlined" class="pa-2 d-flex align-center card-border" min-height="54">
            <v-row no-gutters class="">
              <v-col
                cols="10"
                class="d-flex align-center"
                :class="`text-${bank.colorClassifications.name}`"
              >
                {{ bank.name }}
              </v-col>
              <v-col cols="2" class="d-flex justify-center align-center">
                <v-btn
                  density="compact"
                  variant="flat"
                  :icon="$ICONS.PENCIL"
                  @click.stop="openEditDialog(bank)"
                ></v-btn>
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
      v-model="dialog"
      title="口座名"
      :colorList="props.colorList"
      @closeDialog="closeDialog"
      @upsert="upsertApi()"
      @delete="deleteApi()"
    />
  </div>
</template>

<script setup lang="ts">
import type { GetBankListItem } from '~/api/supabase/bank.interface';
import type { GetColorClassificationListOutput } from '~/api/supabase/colorClassification.interface';
import { PostgrestErrorCode } from '~/api/supabase/common.interface';
import { assertApiResponse } from '~/utils/api';
import type { Id } from '~/utils/types/common';
import type { NameAndColorDialog } from './SettingDialog.vue';

const { enableLoading, disableLoading } = useLoadingStore();
const [authStore, pairStore] = [useAuthStore(), usePairStore()];
const { isDemoLogin, userUid } = storeToRefs(authStore);
const { deleteBank, getBankList, upsertBank } = useSupabase();
const { isPair } = storeToRefs(pairStore);
const { $ICONS } = useNuxtApp();
const { setToast } = useToastStore();

type Props = {
  colorList: GetColorClassificationListOutput['data'];
};
const props = defineProps<Props>();

const bankList = ref<GetBankListItem[]>([]);
const dialog = ref<NameAndColorDialog>({
  isShow: false,
  isWithColor: true,
  id: null,
  name: null,
  colorId: null,
  isHasColor: true,
});

const updateShowData = async () => {
  const apiRes = await getBankList({ userUid: userUid.value });
  assertApiResponse(apiRes);
  bankList.value = apiRes.data;
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
const openEditDialog = ({ id, name, colorClassificationId }: GetBankListItem) => {
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
    alert('予期せぬ状態: bankDialog');
    return;
  }

  const auth = {
    isDemoLogin: isDemoLogin.value,
    userUid: userUid.value,
    isPair: isPair.value,
  };
  const payload = {
    id: dialog.value.id,
    name: dialog.value.name,
    colorId: dialog.value.colorId,
  };
  const apiRes = await upsertBank(auth, payload);
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
    alert('予期せぬ状態: bankDialog');
    return;
  }

  const payload = { id: dialog.value.id };
  const apiRes = await deleteBank({ isDemoLogin: isDemoLogin.value }, payload);
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
