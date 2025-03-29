<template>
  <div>
    <h4 class="mb-2">定期的な収入・支出</h4>

    <div class="px-3 mb-4">
      <v-row
        v-for="(plannedRecord, plannedRecordIndex) of plannedRecordList[isPair ? 'pair' : 'self']"
        :key="plannedRecord.plannedRecordId"
        no-gutters
        class="mb-2"
      >
        <v-col cols="2" class="pa-2 fs-sm">
          <v-row no-gutters class="h-50">
            <v-col class="d-flex justify-center align-center">
              {{ plannedRecord.dayClassificationName }}</v-col
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
                    plannedRecord.plannedRecordId,
                    plannedRecordList[isPair ? 'pair' : 'self'][plannedRecordIndex + 1]
                      .plannedRecordId
                  )
                "
              ></v-btn>
            </v-col>
          </v-row>
        </v-col>
        <v-col cols="10">
          <RecordCard
            :isDisable="false"
            :isPairType="plannedRecord.isPair"
            :typeColor="plannedRecord.typeColorClassificationName"
            :typeAndSubtype="
              StringUtility.typeAndSubtype(plannedRecord.typeName, plannedRecord.subTypeName)
            "
            :isShowPlannedIcon="true"
            :isEnableEdit="
              plannedRecord.isSelf || (plannedRecord.isPair && plannedRecord.pairUserName == null)
            "
            :isPairMethod="plannedRecord.isPair && plannedRecord.pairUserName == null"
            :userName="plannedRecord.pairUserName ?? ''"
            :methodColor="plannedRecord.methodColorClassificationName"
            :methodName="plannedRecord.methodName"
            :memo="plannedRecord.memo ?? ''"
            :isShowBlueColorPrice="!plannedRecord.isPay"
            :price="
              StringUtility.ConvertIntToShowStrWithIsPay(plannedRecord.price, plannedRecord.isPay)
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
import type {
  GetPlannedRecordListItem,
  GetPlannedRecordListOutput,
} from '@/api/supabase/plannedRecord.interface';
import { PAGE } from '@/utils/constants';
import StringUtility from '@/utils/string';
import { type Id } from '@/utils/types/common';
import {
  routerParamKey,
  type PlannedRecord,
  type RouterQuerySettingToNote,
} from '@/utils/types/page';

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

const plannedRecordList = ref<GetPlannedRecordListOutput['data']>({ self: [], pair: [] });

const updateShowData = async () => {
  const apiRes = await getPlannedRecordList({
    isDemoLogin: isDemoLogin.value,
    userUid: userUid.value,
  });
  if (apiRes.error != null) {
    alert(apiRes.message + `(Error: ${JSON.stringify(apiRes.error)})`);
    return;
  }
  plannedRecordList.value = apiRes.data;
};
const goPlannedRecordEditPage = (plannedRecord: GetPlannedRecordListItem) => {
  const tmpPlannedRecord: PlannedRecord = {
    ...plannedRecord,
    id: plannedRecord.plannedRecordId,
  };
  setRouterParam(routerParamKey.PLANNED_RECORD, tmpPlannedRecord);
  const query: RouterQuerySettingToNote = {
    routerParamKey: routerParamKey.PLANNED_RECORD,
  };
  router.push({ name: PAGE.NOTE, query });
};
const goPlannedRecordCreatePage = () => {
  setRouterParam(routerParamKey.PLANNED_RECORD, null);
  const query: RouterQuerySettingToNote = {
    routerParamKey: routerParamKey.PLANNED_RECORD,
  };
  router.push({ name: PAGE.NOTE, query });
};
const swapSort = async (prevId: Id, nextId: Id) => {
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
