<template>
  <div>
    <h4 class="mb-2">定期的な収入・支出</h4>

    <div class="px-3 mb-4">
      <v-row
        v-for="(plannedRecord, plannedRecordIndex) of plannedRecordList[isPair ? 'pair' : 'self']"
        :key="plannedRecord.planned_record_id"
        no-gutters
        class="mb-2"
      >
        <v-col cols="2" class="pa-2 fs-sm">
          <v-row no-gutters class="h-50">
            <v-col class="d-flex justify-center align-center">
              {{ plannedRecord.day_classification_name }}</v-col
            >
          </v-row>
          <v-row no-gutters class="h-50">
            <v-col class="d-flex justify-center align-end">
              <v-btn
                v-if="plannedRecordIndex < plannedRecordList[isPair ? 'pair' : 'self'].length - 1"
                size="small"
                variant="flat"
                :icon="$ICONS.ARROW_DOWN"
                @click.stop="
                  swapSort(
                    plannedRecord.planned_record_id,
                    plannedRecordList[isPair ? 'pair' : 'self'][plannedRecordIndex + 1]
                      .planned_record_id
                  )
                "
              ></v-btn>
            </v-col>
          </v-row>
        </v-col>
        <v-col cols="10">
          <RecordCard
            :isDisable="false"
            :isPairType="plannedRecord.is_pair"
            :typeColor="plannedRecord.type_color_classification_name"
            :typeAndSubtype="
              StringUtility.typeAndSubtype(plannedRecord.type_name, plannedRecord.sub_type_name)
            "
            :isShowPlannedIcon="true"
            :isEnableEdit="
              plannedRecord.is_self ||
              (plannedRecord.is_pair && plannedRecord.pair_user_name == null)
            "
            :isPairMethod="plannedRecord.is_pair && plannedRecord.pair_user_name == null"
            :userName="plannedRecord.pair_user_name ? plannedRecord.pair_user_name : ''"
            :methodColor="plannedRecord.method_color_classification_name"
            :methodName="plannedRecord.method_name"
            :memo="plannedRecord.memo ?? ''"
            :isShowBlueColorPrice="!plannedRecord.is_pay"
            :price="
              StringUtility.ConvertIntToShowStrWithIsPay(plannedRecord.price, plannedRecord.is_pay)
            "
            @edit="goPlannedRecordEditPage(plannedRecord)"
          ></RecordCard>
        </v-col>
      </v-row>
      <v-row no-gutters>
        <v-col class="d-flex justify-end">
          <v-btn
            rounded
            variant="flat"
            color="primary"
            height="32"
            width="70"
            @click="goPlannedRecordCreatePage()"
            >＋</v-btn
          >
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { DUMMY, PAGE } from '@/utils/constants';
import StringUtility from '@/utils/string';
import type { GetPlannedRecordListRpc } from '@/utils/types/api';
import {
  crud,
  routerParamKey,
  type PlannedRecord,
  type RouterQuerySettingToNote,
} from '@/utils/types/common';

const { enableLoading, disableLoading } = useLoadingStore();
const [loginStore, pairStore, userStore] = [useLoginStore(), usePairStore(), useUserStore()];
const { isDemoLogin } = storeToRefs(loginStore);
const { isPair } = storeToRefs(pairStore);
const { userUid } = storeToRefs(userStore);
const { $ICONS } = useNuxtApp();
const { setRouterParam } = useRouterParamStore();
const router = useRouter();
const { getPlannedRecordList, swapPlannedRecord } = useSupabase();
const { setToast } = useToastStore();

type PlannedRecordList = {
  self: GetPlannedRecordListRpc[];
  pair: GetPlannedRecordListRpc[];
};

const plannedRecordList = ref<PlannedRecordList>({ self: [], pair: [] });

const updateShowData = async () => {
  const apiRes = await getPlannedRecordList({
    isDemoLogin: isDemoLogin.value,
    userUid: userUid.value ?? DUMMY.STR,
  });
  if (apiRes.error != null) {
    alert(apiRes.message + `(Error: ${JSON.stringify(apiRes.error)})`);
    return;
  }
  plannedRecordList.value = apiRes.data;
};
const goPlannedRecordEditPage = (plannedRecord: GetPlannedRecordListRpc) => {
  const tmpPlannedRecord: PlannedRecord = {
    ...plannedRecord,
    id: plannedRecord.planned_record_id,
  };
  setRouterParam(routerParamKey.PLANNED_RECORD, tmpPlannedRecord);
  const query: RouterQuerySettingToNote = {
    routerParamKey: routerParamKey.PLANNED_RECORD,
    crud: crud.UPDATE,
  };
  router.push({ name: PAGE.NOTE, query });
};
const goPlannedRecordCreatePage = () => {
  const tmpPlannedRecord: PlannedRecord = {
    id: DUMMY.NM,
    is_pay: DUMMY.BL,
    price: DUMMY.NM,
    memo: null,
    day_classification_id: DUMMY.NM,
    method_id: DUMMY.NM,
    type_id: DUMMY.NM,
    sub_type_id: null,
    pair_user_name: null,
  };
  setRouterParam(routerParamKey.PLANNED_RECORD, tmpPlannedRecord);
  const query: RouterQuerySettingToNote = {
    routerParamKey: routerParamKey.PLANNED_RECORD,
    crud: crud.CREATE,
  };
  router.push({ name: PAGE.NOTE, query });
};
const swapSort = async (prevId: number, nextId: number) => {
  enableLoading();
  const payload = { prevId: prevId, nextId: nextId };
  const apiRes = await swapPlannedRecord({ isDemoLogin: isDemoLogin.value }, payload);
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
