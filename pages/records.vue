<template>
  <v-container class="pa-0 h-100 bg-white">
    <div>
      <v-row no-gutters class="mb-1 px-2 bg-blue-grey-lighten-4 height-48px align-center">
        <v-col cols="3">
          <v-btn color="grey" variant="outlined" @click="goSummaryPage()">＜</v-btn>
        </v-col>
        <v-col cols="3" class="d-flex align-center fs-sm">
          {{
            showSetting.isType
              ? showSetting.isPay
                ? '支出カテゴリ'
                : '収入カテゴリ'
              : showSetting.isPay
              ? '支払方法'
              : '受取方法'
          }}<br v-if="showSetting.isIncludeInstead !== null" />{{
            showSetting.isIncludeInstead !== null &&
            (showSetting.isIncludeInstead ? '　立替込み' : '　立替除く')
          }}
        </v-col>
        <v-col cols="6" class="d-flex justify-end">
          <!-- TODO summaryPieと共通化 -->
          <v-card
            variant="outlined"
            height="30"
            width="200"
            class="d-flex justify-center align-center bg-white"
          >
            <div v-if="showSetting.isType" class="py-0 pl-2">
              <v-avatar
                size="24"
                :color="color"
                :icon="showSetting.isPair ? $ICONS.SHARE : ''"
                class="mr-2 text-white"
              >
              </v-avatar>
              {{ name }}
            </div>
            <div v-else class="py-0 pl-2">
              <v-row no-gutters class="d-flex align-center">
                <span v-if="showSetting.isPair && pairUserName" class="mr-2 fs-sm">
                  {{ pairUserName }}
                </span>
                <v-icon v-else-if="showSetting.isPair" small class="mr-2">
                  {{ $ICONS.SHARE }}
                </v-icon>
                <span :class="`${color}--text`">{{ name }}</span>
              </v-row>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </div>
    <div class="px-5 pt-2">
      <PaginationBar
        :title="focusPeriod"
        :subtitle="name !== '' ? '合計: ' + sum + ' 円' : ''"
        @prev="movePrev()"
        @next="moveNext()"
      ></PaginationBar>

      <div v-if="recordList" no-gutters>
        <div v-for="(record, index) in recordList" :key="index" class="mb-2">
          <v-row no-gutters>
            <h4>{{ TimeUtility.ConvertDBResponseDatetimeToDateStr(record.datetime) }}</h4>
          </v-row>
          <v-row no-gutters>
            <v-col>
              <RecordCard
                :isDisable="false"
                :isPairType="record.isPair"
                :typeColor="record.typeColorClassificationName"
                :typeAndSubtype="StringUtility.typeAndSubtype(record.typeName, record.subTypeName)"
                :isShowPlannedIcon="!!record.plannedRecordId"
                :isEnableEdit="record.isSelf || (record.isPair && !record.isInstead)"
                :isPairMethod="record.isPair && !record.isInstead"
                :userName="record.pairUserName ?? ''"
                :methodColor="record.methodColorClassificationName"
                :methodName="record.methodName"
                :memo="record.memo ?? ''"
                :isShowBlueColorPrice="!record.isPay"
                :price="StringUtility.ConvertIntToShowStrWithIsPay(record.price, record.isPay)"
                @edit="goRecordEditPage(record)"
              ></RecordCard>
            </v-col>
          </v-row>
        </div>
      </div>
      <div v-else class="w-100 text-center">表示するデータがありません</div>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import type { GetSummarizedRecordItem } from '@/api/supabase/record.interface';
import { PAGE } from '@/utils/constants';
import StringUtility from '@/utils/string';
import TimeUtility from '@/utils/time';
import { Crud, type ColorString, type Id, type YearMonthObj } from '@/utils/types/common';
import {
  routerParamKey,
  type RecordsQueryParam,
  type RouterQueryCalendarToNote,
  type SummaryQueryParam,
} from '@/utils/types/page';

const { enableLoading, disableLoading } = useLoadingStore();
const [loginStore, userStore] = [useLoginStore(), useUserStore()];
const { isDemoLogin } = storeToRefs(loginStore);
const { userUid } = storeToRefs(userStore);
const { setIsPair } = usePairStore();
const { $ICONS } = useNuxtApp();
const { routerParam, setRouterParam } = useRouterParamStore();
const router = useRouter();
const { getSummarizedRecordList } = useSupabase();

type ShowSetting = {
  isPay: boolean;
  isMonth: boolean;
  isType: boolean;
  isPair: boolean;
  isIncludeInstead: boolean | null;
  id: Id | null;
  subtypeId: Id | null;
};

const focus = ref<YearMonthObj>(TimeUtility.GetNowYearMonthObj(isDemoLogin.value));
const name = ref<string>('');
const color = ref<ColorString>('black');
const pairUserName = ref<string | null>(null);
const sum = ref<string>('');
const showSetting = ref<ShowSetting>({
  isPay: true,
  isMonth: true,
  isType: true,
  isPair: false,
  isIncludeInstead: null,
  id: null,
  subtypeId: null,
});
const recordList = ref<GetSummarizedRecordItem[]>([]);

const focusPeriod = computed(() => {
  if (showSetting.value.isMonth) {
    return TimeUtility.ConvertYearMonthObjToJPYearMonth(focus.value);
  } else {
    return TimeUtility.ConvertYearMonthObjToJPYear(focus.value);
  }
});

const movePrev = async () => {
  if (showSetting.value.isMonth) {
    focus.value = TimeUtility.PrevMonthInYearMonthObj(focus.value); // todo change
  } else {
    // focus.value = TimeUtility.PrevYearInYearMonthObj(focus.value);
  }

  await updateList();
  updateSum();
};
const moveNext = async () => {
  if (showSetting.value.isMonth) {
    focus.value = TimeUtility.NextMonthInYearMonthObj(focus.value);
  } else {
    // focus.value = TimeUtility.NextYearInYearMonthObj(focus.value);
  }

  await updateList();
  updateSum();
};
const setPageList = async (param: RecordsQueryParam) => {
  showSetting.value = {
    isPay: param.isPay,
    isMonth: param.isMonth,
    isType: param.isType,
    isPair: param.isPair,
    isIncludeInstead: param.isIncludeInstead,
    id: param.id,
    subtypeId: param.subtypeId,
  };
  focus.value = param.focus;
  name.value = param.name;
  color.value = param.color;
  pairUserName.value = param.pairUserName;

  await updateList();
  updateSum();
};
const updateList = async () => {
  enableLoading();
  if (showSetting.value.id === null) {
    alert('予期せぬ状態: updateList');
    return;
  }
  const tmpPayload = {
    isPay: showSetting.value.isPay,
    isType: showSetting.value.isType,
    isPair: showSetting.value.isPair,
    isIncludeInstead: showSetting.value.isIncludeInstead ?? false,
    id: showSetting.value.id,
    subtypeId: showSetting.value.subtypeId,
  };
  const payload = {
    ...tmpPayload,
    yearMonth: TimeUtility.ConvertYearMonthObjToYearMonth(focus.value),
  };

  const apiRes = await getSummarizedRecordList(
    { isDemoLogin: isDemoLogin.value, userUid: userUid.value },
    payload
  );
  if (apiRes.error !== null || apiRes.data === null) {
    alert(apiRes.message + `(Error: ${apiRes.error})`);
    return;
  }

  recordList.value = apiRes.data;
  disableLoading();
};
const updateSum = () => {
  const tmpSum = recordList.value.reduce(function (sum, record) {
    return sum + record.price;
  }, 0);
  sum.value = StringUtility.ConvertIntToShowStr(tmpSum);
};
const goSummaryPage = () => {
  const summaryQueryParam: SummaryQueryParam = {
    isPay: showSetting.value.isPay,
    isType: showSetting.value.isType,
    isMonth: showSetting.value.isMonth,
    focus: focus.value,
  };
  setRouterParam(routerParamKey.SUMMARY_QUERY_PARAM, summaryQueryParam);
  router.push({ name: PAGE.SUMMARY });
};
const goRecordEditPage = (record: GetSummarizedRecordItem) => {
  setIsPair(record.isPair);

  setRouterParam(routerParamKey.RECORD, record);
  const query: RouterQueryCalendarToNote = {
    routerParamKey: routerParamKey.RECORD,
    crud: Crud.UPDATE,
  };
  router.push({ name: PAGE.NOTE, query });
};

// created
(async () => {
  const recordsQuery = routerParam<RecordsQueryParam>(routerParamKey.RECORDS_QUERY_PARAM);
  if (recordsQuery == null) {
    alert('不正な画面遷移です');
    router.push({ name: PAGE.SUMMARY });
    return;
  }
  await setPageList(recordsQuery);
})();
</script>

<style lang="scss" scoped>
.height-48px {
  height: 48px; // 48px は summary 画面における、 v-tabs の高さ
}
</style>
