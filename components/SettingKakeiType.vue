<template>
  <div>
    <h4 class="mb-2">カテゴリ</h4>

    <div class="px-3 mb-4">
      <v-row class="mb-3" no-gutters>
        <v-col class="d-flex flex-row">
          <v-btn-toggle v-model="isPay" density="compact" variant="outlined" mandatory>
            <v-btn :value="true" min-width="70" class="px-0">支出</v-btn>
            <v-btn :value="false" min-width="70" class="px-0">収入</v-btn>
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

      <v-row
        v-for="(type, typeIndex) of typeList[isPay ? 'pay' : 'income'][isPair ? 'pair' : 'self']"
        :key="type.type_id"
        class="mb-2"
        no-gutters
      >
        <v-col>
          <v-card variant="outlined" class="pa-1 card-border">
            <v-row no-gutters class="mb-1">
              <v-col cols="10" class="px-4 d-flex justify-start align-center">
                <v-avatar
                  size="30"
                  :color="type.color_classification_name"
                  :icon="isPair ? $ICONS.SHARE : ''"
                  class="mr-3 text-white"
                ></v-avatar>
                {{ type.type_name }}
              </v-col>
              <v-col cols="2" class="pr-4 d-flex justify-center align-center">
                <v-btn
                  v-if="isEdit"
                  density="compact"
                  variant="flat"
                  :icon="$ICONS.PENCIL"
                  @click.stop="openEditTypeDialog(type)"
                ></v-btn>
                <v-btn
                  v-else-if="
                    !isEdit &&
                    typeIndex <
                      typeList[isPay ? 'pay' : 'income'][isPair ? 'pair' : 'self'].length - 1
                  "
                  density="compact"
                  variant="flat"
                  :icon="$ICONS.ARROW_DOWN"
                  @click.stop="
                    swapSort(
                      mode.TYPE,
                      type.type_id,
                      typeList[isPay ? 'pay' : 'income'][isPair ? 'pair' : 'self'][typeIndex + 1]
                        .type_id
                    )
                  "
                ></v-btn>
                <v-btn v-else :icon="''" density="compact" variant="flat"></v-btn>
              </v-col>
            </v-row>
            <v-divider class="mb-1" />
            <v-row no-gutters class="pa-1">
              <v-col
                v-for="(subType, subTypeIndex) of type.sub_types"
                :key="subType.sub_type_id"
                cols="6"
                class="col-subtype"
              >
                <v-row no-gutters>
                  <v-col cols="10" class="fs-sm"> {{ subType.sub_type_name }} </v-col>
                  <v-col cols="2" class="d-flex justify-center align-center">
                    <v-btn
                      v-if="isEdit"
                      :icon="$ICONS.PENCIL"
                      size="x-small"
                      variant="flat"
                      density="compact"
                      @click.stop="openEditSubTypeDialog(subType)"
                    ></v-btn>
                    <v-btn
                      v-else-if="!isEdit && subTypeIndex < type.sub_types.length - 1"
                      :icon="subTypeIndex % 2 === 0 ? $ICONS.ARROW_RIGHT : $ICONS.ARROW_BOTTOM_LEFT"
                      size="x-small"
                      variant="flat"
                      density="compact"
                      @click.stop="
                        swapSort(
                          'SUB_TYPE',
                          subType.sub_type_id,
                          type.sub_types[subTypeIndex + 1].sub_type_id
                        )
                      "
                    ></v-btn>
                    <v-btn
                      v-else
                      :icon="''"
                      size="x-small"
                      variant="flat"
                      density="compact"
                    ></v-btn>
                  </v-col>
                </v-row>
              </v-col>
            </v-row>
            <v-row no-gutters class="d-flex justify-end align-end">
              <v-btn
                variant="flat"
                rounded
                size="small"
                color="primary"
                @click="openCreateSubTypeDialog(type)"
                >＋</v-btn
              >
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
            @click="openCreateTypeDialog()"
            >＋</v-btn
          >
        </v-col>
      </v-row>
    </div>

    <SettingDialog
      v-model="typeDialog"
      title="カテゴリ名"
      :colorList="props.colorList"
      @closeDialog="closeDialog"
      @upsert="upsertApi(mode.TYPE)"
      @delete="deleteApi(mode.TYPE)"
    />
    <SettingDialog
      v-model="subTypeDialog"
      title="サブカテゴリ名"
      :colorList="undefined"
      @closeDialog="closeDialog"
      @upsert="upsertApi(mode.SUB_TYPE)"
      @delete="deleteApi(mode.SUB_TYPE)"
    />
  </div>
</template>

<script setup lang="ts">
import type { ColorList } from '@/pages/setting.vue';
import { DUMMY } from '@/utils/constants';

const { enableLoading, disableLoading } = useLoadingStore();
const [loginStore, pairStore, userStore] = [useLoginStore(), usePairStore(), useUserStore()];
const { isDemoLogin } = storeToRefs(loginStore);
const { isPair, pairId } = storeToRefs(pairStore);
const { userUid } = storeToRefs(userStore);
const { $ICONS } = useNuxtApp();
const { deleteType, deleteSubType, getTypeList, swapType, swapSubType, upsertType, upsertSubType } =
  useSupabase();
const { setToast } = useToastStore();

type Props = {
  colorList: ColorList;
};
const props = defineProps<Props>();
const mode = {
  TYPE: 'TYPE',
  SUB_TYPE: 'SUB_TYPE',
} as const;
type Mode = (typeof mode)[keyof typeof mode];
export type TypeDialog = {
  isShow: boolean;
  isWithColor: true;
  id: number | null;
  name: string | null;
  colorId: number | null;
};
export type SubTypeDialog = {
  isShow: boolean;
  isWithColor: false;
  id: number | null;
  name: string | null;
  parentId: number | null;
};

const isPay = ref<boolean>(true);
const isEdit = ref<boolean>(true);
const typeList = ref({ income: { self: [], pair: [] }, pay: { self: [], pair: [] } } as any);
const typeDialog = ref<TypeDialog>({
  isShow: false,
  isWithColor: true,
  id: null,
  name: null,
  colorId: null,
});
const subTypeDialog = ref<SubTypeDialog>({
  isShow: false,
  isWithColor: false,
  id: null,
  name: null,
  parentId: null,
});

const updateShowData = async () => {
  const apiRes = await getTypeList({
    isDemoLogin: isDemoLogin.value,
    userUid: userUid.value ?? DUMMY.STR,
  });
  if (apiRes.error != null) {
    alert(apiRes.message + `(Error: ${JSON.stringify(apiRes.error)})`);
    return;
  }
  typeList.value = apiRes.data;
};
const openCreateTypeDialog = () => {
  typeDialog.value = {
    isShow: true,
    isWithColor: true,
    id: null,
    name: null,
    colorId: null,
  };
};
const openEditTypeDialog = ({ type_id, type_name, color_classification_id }: any) => {
  typeDialog.value = {
    isShow: true,
    isWithColor: true,
    id: type_id,
    name: type_name,
    colorId: color_classification_id,
  };
};
const closeDialog = () => {
  typeDialog.value.isShow = false;
  subTypeDialog.value.isShow = false;
};
const upsertApi = async (inputMode: Mode) => {
  enableLoading();
  let isCreated = false;
  const auth = {
    isDemoLogin: isDemoLogin.value,
    userUid: userUid.value ?? DUMMY.STR,
    isPair: isPair.value,
    pairId: pairId.value ?? DUMMY.NM,
  };

  if (inputMode === mode.TYPE) {
    const payload = {
      id: typeDialog.value.id,
      name: typeDialog.value.name,
      isPay: isPay.value,
      colorId: typeDialog.value.colorId,
    };
    const apiRes = await upsertType(auth, payload);
    if (apiRes.error !== null) {
      alert(apiRes.message + `(Error: ${JSON.stringify(apiRes.error)})`);
      return;
    }
    isCreated = !!typeDialog.value.id;
  } else if (inputMode === mode.SUB_TYPE) {
    const payload = {
      id: subTypeDialog.value.id,
      typeId: subTypeDialog.value.parentId,
      name: subTypeDialog.value.name,
    };
    const apiRes = await upsertSubType(auth, payload);
    if (apiRes.error !== null) {
      alert(apiRes.message + `(Error: ${JSON.stringify(apiRes.error)})`);
      return;
    }
    isCreated = !!subTypeDialog.value.id;
  } else {
    alert('想定外');
    return;
  }

  await updateShowData();
  disableLoading();
  setToast(isCreated ? '変更しました' : '登録しました');
  closeDialog();
};
const deleteApi = async (inputMode: Mode) => {
  enableLoading();
  let apiRes;
  if (inputMode === mode.TYPE) {
    apiRes = await deleteType({ isDemoLogin: isDemoLogin.value }, { id: typeDialog.value.id });
  } else if (inputMode === mode.SUB_TYPE) {
    apiRes = await deleteSubType(
      { isDemoLogin: isDemoLogin.value },
      { id: subTypeDialog.value.id }
    );
  } else {
    alert('想定外');
    return;
  }
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
const openCreateSubTypeDialog = ({ type_id }: any) => {
  subTypeDialog.value = {
    isShow: true,
    isWithColor: false,
    id: null,
    parentId: type_id,
    name: null,
  };
};
const openEditSubTypeDialog = ({ sub_type_id, type_id, sub_type_name }: any) => {
  subTypeDialog.value = {
    isShow: true,
    isWithColor: false,
    id: sub_type_id,
    parentId: type_id,
    name: sub_type_name,
  };
};
const swapSort = async (inputMode: Mode, prevId: number, nextId: number) => {
  enableLoading();
  let apiRes;
  const payload = { prevId: prevId, nextId: nextId };

  if (inputMode === mode.TYPE) {
    apiRes = await swapType({ isDemoLogin: isDemoLogin.value }, payload);
  } else if (inputMode === mode.SUB_TYPE) {
    apiRes = await swapSubType({ isDemoLogin: isDemoLogin.value }, payload);
  } else {
    alert('想定外');
    return;
  }
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
