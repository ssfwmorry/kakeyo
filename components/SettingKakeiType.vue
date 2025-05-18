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
import { PostgrestErrorCode } from '@/api/supabase/common.interface';
import type {
  GetTypeListItem,
  GetTypeListItemSubTypeListItem,
  GetTypeListOutputData,
} from '@/api/supabase/type.interface';
import { assertApiResponse } from '@/utils/api';
import type { Id } from '@/utils/types/common';
import type { NameAndColorDialog, NameDialog } from './SettingDialog.vue';

const { enableLoading, disableLoading } = useLoadingStore();
const [authStore, pairStore] = [useAuthStore(), usePairStore()];
const { isDemoLogin, pairId, userUid } = storeToRefs(authStore);
const { isPair } = storeToRefs(pairStore);
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
type TypeDialog = NameAndColorDialog;
type SubTypeDialog = NameDialog;

const isPay = ref(true);
const isEdit = ref(true);
const typeList = ref<GetTypeListOutputData>({
  income: { self: [], pair: [] },
  pay: { self: [], pair: [] },
});
const typeDialog = ref<TypeDialog>({
  isShow: false,
  isWithColor: true,
  id: null,
  name: null,
  colorId: null,
  isHasColor: true,
});
const subTypeDialog = ref<SubTypeDialog>({
  isShow: false,
  isWithColor: false,
  id: null,
  name: null,
  parentId: null,
  isHasColor: false,
});

const updateShowData = async () => {
  const apiRes = await getTypeList({ userUid: userUid.value });
  assertApiResponse(apiRes);
  typeList.value = apiRes.data;
};
const openCreateTypeDialog = () => {
  typeDialog.value = {
    isShow: true,
    isWithColor: true,
    id: null,
    name: null,
    colorId: null,
    isHasColor: true,
  };
};
const openEditTypeDialog = ({ typeId, typeName, colorClassificationId }: GetTypeListItem) => {
  typeDialog.value = {
    isShow: true,
    isWithColor: true,
    id: typeId,
    name: typeName,
    colorId: colorClassificationId,
    isHasColor: true,
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
    assertApiResponse(apiRes);
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
    assertApiResponse(apiRes);
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
const openCreateSubTypeDialog = ({ typeId }: GetTypeListItem) => {
  subTypeDialog.value = {
    isShow: true,
    isWithColor: false,
    id: null,
    parentId: typeId,
    name: null,
    isHasColor: false,
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
    isHasColor: false,
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
