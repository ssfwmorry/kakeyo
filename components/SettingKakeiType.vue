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
        :key="type.typeId"
        class="mb-2"
        no-gutters
      >
        <v-col>
          <v-card variant="outlined" class="pa-1 card-border">
            <v-row no-gutters class="mb-1">
              <v-col cols="10" class="px-4 d-flex justify-start align-center">
                <v-avatar
                  size="30"
                  :color="type.colorClassificationName"
                  :icon="isPair ? $ICONS.SHARE : ''"
                  class="mr-3 text-white"
                ></v-avatar>
                {{ type.typeName }}
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
                      type.typeId,
                      typeList[isPay ? 'pay' : 'income'][isPair ? 'pair' : 'self'][typeIndex + 1]
                        .typeId
                    )
                  "
                ></v-btn>
                <v-btn v-else :icon="''" density="compact" variant="flat"></v-btn>
              </v-col>
            </v-row>
            <v-divider class="mb-1" />
            <v-row no-gutters class="pa-1">
              <v-col
                v-for="(subType, subTypeIndex) of type.subTypes"
                :key="subType.subTypeId"
                cols="6"
                class="col-subtype"
              >
                <v-row no-gutters>
                  <v-col cols="10" class="fs-sm"> {{ subType.subTypeName }} </v-col>
                  <v-col cols="2" class="d-flex justify-center align-center">
                    <v-btn
                      v-if="isEdit"
                      :icon="$ICONS.PENCIL"
                      size="x-small"
                      variant="flat"
                      density="compact"
                      @click.stop="openEditSubTypeDialog(type.typeId, subType)"
                    ></v-btn>
                    <v-btn
                      v-else-if="!isEdit && subTypeIndex < type.subTypes.length - 1"
                      :icon="subTypeIndex % 2 === 0 ? $ICONS.ARROW_RIGHT : $ICONS.ARROW_BOTTOM_LEFT"
                      size="x-small"
                      variant="flat"
                      density="compact"
                      @click.stop="
                        swapSort(
                          'SUB_TYPE',
                          subType.subTypeId,
                          type.subTypes[subTypeIndex + 1].subTypeId
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
import type { GetColorClassificationListOutput } from '@/api/supabase/colorClassification.interface';
import type {
  GetTypeListItem,
  GetTypeListItemSubTypeListItem,
  GetTypeListOutput,
} from '@/api/supabase/type.interface';
import type { Id } from '@/utils/types/common';

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
  colorList: GetColorClassificationListOutput['data'];
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
  id: Id | null;
  name: string | null;
  colorId: Id | null;
};
export type SubTypeDialog = {
  isShow: boolean;
  isWithColor: false;
  id: Id | null;
  name: string | null;
  parentId: Id | null;
};

const isPay = ref<boolean>(true);
const isEdit = ref<boolean>(true);
const typeList = ref<GetTypeListOutput['data']>({
  income: { self: [], pair: [] },
  pay: { self: [], pair: [] },
});
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
    userUid: userUid.value,
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
const openEditTypeDialog = ({ typeId, typeName, colorClassificationId }: GetTypeListItem) => {
  typeDialog.value = {
    isShow: true,
    isWithColor: true,
    id: typeId,
    name: typeName,
    colorId: colorClassificationId,
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
    userUid: userUid.value,
    isPair: isPair.value,
    pairId: pairId.value,
  };

  if (inputMode === mode.TYPE) {
    if (!validateUpsertTypeApi(typeDialog.value)) {
      alert('予期せぬ状態: typeDialog');
      return;
    }
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
    if (!validateUpsertSubTypeApi(subTypeDialog.value)) {
      alert('予期せぬ状態: subTypeDialog');
      return;
    }

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
const validateUpsertTypeApi = (
  dialog: TypeDialog
): dialog is TypeDialog & { name: string; colorId: Id } => {
  return dialog.name != null && dialog.colorId !== null;
};
const validateUpsertSubTypeApi = (
  dialog: SubTypeDialog
): dialog is SubTypeDialog & { parentId: Id; name: string } => {
  return dialog.parentId != null && dialog.name !== null;
};
const deleteApi = async (inputMode: Mode) => {
  enableLoading();
  let apiRes;
  if (inputMode === mode.TYPE) {
    if (typeDialog.value.id === null) {
      alert('予期せぬ状態: typeDialog');
      return;
    }

    apiRes = await deleteType({ isDemoLogin: isDemoLogin.value }, { id: typeDialog.value.id });
  } else if (inputMode === mode.SUB_TYPE) {
    if (subTypeDialog.value.id === null) {
      alert('予期せぬ状態: subTypeDialog');
      return;
    }

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
const openCreateSubTypeDialog = ({ typeId }: GetTypeListItem) => {
  subTypeDialog.value = {
    isShow: true,
    isWithColor: false,
    id: null,
    parentId: typeId,
    name: null,
  };
};
const openEditSubTypeDialog = (
  typeId: Id,
  { subTypeId, subTypeName }: GetTypeListItemSubTypeListItem
) => {
  subTypeDialog.value = {
    isShow: true,
    isWithColor: false,
    id: subTypeId,
    parentId: typeId,
    name: subTypeName,
  };
};
const swapSort = async (inputMode: Mode, prevId: Id, nextId: Id) => {
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
