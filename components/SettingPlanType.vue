<template>
  <div>
    <h4 class="mb-2">カテゴリ</h4>

    <div class="px-3 mb-4">
      <v-row
        v-for="(planType, planTypeIndex) of planTypeList[isPair ? 'pair' : 'self']"
        :key="planType.plan_type_id"
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
                  :class="`bg-${planType.color_classification_name}`"
                  class="mr-3 btn-icon text-white"
                  ><v-icon>{{ isPair ? $ICONS.SHARE : '' }}</v-icon> </v-btn
                >{{ planType.plan_type_name }}
              </v-col>
              <v-col cols="2" class="pr-4 d-flex justify-center align-center">
                <v-btn
                  v-if="planTypeIndex < planTypeList[isPair ? 'pair' : 'self'].length - 1"
                  variant="flat"
                  density="compact"
                  :icon="$ICONS.ARROW_DOWN"
                  @click.stop="
                    swapSort(
                      planType.plan_type_id,
                      planTypeList[isPair ? 'pair' : 'self'][planTypeIndex + 1].plan_type_id
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
import type { TypeDialog } from '@/components/SettingKakeiType.vue';
import type { ColorList } from '@/pages/setting.vue';
import { dummy } from '@/types/common';

const { enableLoading, disableLoading } = useLoadingStore();
const [loginStore, pairStore, userStore] = [useLoginStore(), usePairStore(), useUserStore()];
const { isDemoLogin } = storeToRefs(loginStore);
const { isPair, pairId } = storeToRefs(pairStore);
const { userUid } = storeToRefs(userStore);
const { $ICONS } = useNuxtApp();
const { deletePlanType, getPlanTypeList, swapPlanType, upsertPlanType } = useSupabase();
const { setToast } = useToastStore();

type Props = {
  colorList: ColorList;
};
const props = defineProps<Props>();
type PlanTypeList = {
  self: any[];
  pair: any[];
};
type PlanTypeDialog = TypeDialog;

const planTypeList = ref<PlanTypeList>({ self: [], pair: [] });
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
    userUid: userUid.value ?? dummy.str,
  });
  if (apiRes.error != null) {
    alert(apiRes.message + `(Error: ${JSON.stringify(apiRes.error)})`);
    return;
  }
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
const openEditDialog = ({ plan_type_id, plan_type_name, color_classification_id }: any) => {
  planTypeDialog.value = {
    isShow: true,
    isWithColor: true,
    id: plan_type_id,
    name: plan_type_name,
    colorId: color_classification_id,
  };
};
const closeDialog = () => {
  planTypeDialog.value.isShow = false;
};
const upsertApi = async () => {
  enableLoading();
  const payload = {
    id: planTypeDialog.value.id,
    name: planTypeDialog.value.name,
    colorId: planTypeDialog.value.colorId,
  };
  const apiRes = await upsertPlanType(
    {
      isDemoLogin: isDemoLogin.value,
      userUid: userUid.value ?? dummy.str,
      isPair: isPair.value,
      pairId: pairId.value ?? dummy.nm,
    },

    payload
  );
  if (apiRes.error !== null) {
    alert(apiRes.message + `(Error: ${JSON.stringify(apiRes.error)})`);
    return;
  }

  await updateShowData();
  disableLoading();
  setToast(planTypeDialog.value.id ? '変更しました' : '登録しました');
  closeDialog();
};
const deleteApi = async () => {
  enableLoading();
  const payload = { id: planTypeDialog.value.id };
  const apiRes = await deletePlanType({ isDemoLogin: isDemoLogin.value }, payload);
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
  closeDialog();
};
const swapSort = async (prevId: number, nextId: number) => {
  enableLoading();
  const payload = { prevId: prevId, nextId: nextId };
  const apiRes = await swapPlanType({ isDemoLogin: isDemoLogin.value }, payload);
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
.col-subtype:nth-child(even) {
  padding-left: 8px !important;
}
.col-subtype:nth-child(odd) {
  padding-right: 8px !important;
}
</style>
