<template>
  <div>
    <h4 class="mb-2">カテゴリ</h4>

    <div class="px-3 mb-4">
      <v-row
        v-for="(planType, planTypeIndex) of planTypeList[isPair ? 'pair' : 'self']"
        :key="planType.planTypeId"
        class="mb-3"
        no-gutters
      >
        <v-col>
          <v-card variant="outlined" class="pa-1 card-border">
            <v-row no-gutters>
              <v-col cols="9" class="px-4 d-flex justify-start align-center">
                <v-btn
                  size="28"
                  dark
                  variant="flat"
                  :class="`bg-${planType.colorClassificationName}`"
                  class="mr-3 btn-icon text-white"
                  ><v-icon>{{ isPair ? $ICONS.SHARE : '' }}</v-icon> </v-btn
                >{{ planType.planTypeName }}
              </v-col>
              <v-col cols="2" class="pr-4 d-flex justify-center align-center">
                <v-btn
                  v-if="planTypeIndex < planTypeList[isPair ? 'pair' : 'self'].length - 1"
                  variant="flat"
                  density="compact"
                  :icon="$ICONS.ARROW_DOWN"
                  @click.stop="
                    swapSort(
                      planType.planTypeId,
                      planTypeList[isPair ? 'pair' : 'self'][planTypeIndex + 1].planTypeId
                    )
                  "
                ></v-btn>
              </v-col>
              <v-col cols="1" class="pr-4 d-flex justify-center align-center">
                <v-btn
                  :icon="$ICONS.PENCIL"
                  variant="flat"
                  density="compact"
                  @click.stop="openEditDialog(planType)"
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
      v-model="planTypeDialog"
      title="カテゴリ名"
      :colorList="props.colorList"
      @closeDialog="closeDialog"
      @upsert="upsertApi()"
      @delete="deleteApi()"
    />
  </div>
</template>

<script setup lang="ts">
import type { GetColorClassificationListOutput } from '@/api/supabase/colorClassification.interface';
import { PostgrestErrorCode } from '@/api/supabase/common.interface';
import type {
  GetPlanTypeListItem,
  GetPlanTypeListOutputData,
} from '@/api/supabase/planType.interface';
import type { TypeDialog } from '@/components/SettingKakeiType.vue';
import { assertApiResponse } from '@/utils/api';
import type { Id } from '@/utils/types/common';

const { enableLoading, disableLoading } = useLoadingStore();
const [authStore, pairStore] = [useAuthStore(), usePairStore()];
const { isDemoLogin, pairId, userUid } = storeToRefs(authStore);
const { isPair } = storeToRefs(pairStore);
const { $ICONS } = useNuxtApp();
const { deletePlanType, getPlanTypeList, swapPlanType, upsertPlanType } = useSupabase();
const { setToast } = useToastStore();

type Props = {
  colorList: GetColorClassificationListOutput['data'];
};
const props = defineProps<Props>();
type PlanTypeDialog = TypeDialog;

const planTypeList = ref<GetPlanTypeListOutputData>({ self: [], pair: [] });
const planTypeDialog = ref<PlanTypeDialog>({
  isShow: false,
  isWithColor: true,
  id: null,
  name: null,
  colorId: null,
});

const updateShowData = async () => {
  const apiRes = await getPlanTypeList({
    isDemoLogin: isDemoLogin.value,
    userUid: userUid.value,
  });
  assertApiResponse(apiRes);
  planTypeList.value = apiRes.data;
};
const openCreateDialog = () => {
  planTypeDialog.value = {
    isShow: true,
    isWithColor: true,
    id: null,
    name: null,
    colorId: null,
  };
};
const openEditDialog = ({
  planTypeId,
  planTypeName,
  colorClassificationId,
}: GetPlanTypeListItem) => {
  planTypeDialog.value = {
    isShow: true,
    isWithColor: true,
    id: planTypeId,
    name: planTypeName,
    colorId: colorClassificationId,
  };
};
const closeDialog = () => {
  planTypeDialog.value.isShow = false;
};
const upsertApi = async () => {
  enableLoading();
  if (!validateUpsertApi(planTypeDialog.value)) {
    alert('予期せぬ状態: typeDialog');
    return;
  }
  const auth = {
    isDemoLogin: isDemoLogin.value,
    userUid: userUid.value,
    isPair: isPair.value,
    pairId: pairId.value,
  };
  const payload = {
    id: planTypeDialog.value.id,
    name: planTypeDialog.value.name,
    colorId: planTypeDialog.value.colorId,
  };
  const apiRes = await upsertPlanType(auth, payload);
  assertApiResponse(apiRes);

  await updateShowData();
  disableLoading();
  setToast(planTypeDialog.value.id ? '変更しました' : '登録しました');
  closeDialog();
};
const validateUpsertApi = (
  dialog: PlanTypeDialog
): dialog is PlanTypeDialog & { name: string; colorId: Id } => {
  return dialog.name != null && dialog.colorId !== null;
};

const deleteApi = async () => {
  enableLoading();
  if (planTypeDialog.value.id === null) {
    alert('予期せぬ状態: planTypeDialog');
    return;
  }
  const payload = { id: planTypeDialog.value.id };
  const apiRes = await deletePlanType({ isDemoLogin: isDemoLogin.value }, payload);
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
  closeDialog();
};
const swapSort = async (prevId: Id, nextId: Id) => {
  enableLoading();
  const payload = { prevId: prevId, nextId: nextId };
  const apiRes = await swapPlanType({ isDemoLogin: isDemoLogin.value }, payload);
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
.col-subtype:nth-child(even) {
  padding-left: 8px !important;
}
.col-subtype:nth-child(odd) {
  padding-right: 8px !important;
}
</style>
