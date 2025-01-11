<template>
  <div
    v-touch="{
      left: () => moveNext(),
      right: () => movePrev(),
    }"
    class="page-tab-item"
  >
    <PaginationBar
      :title="focusPeriod"
      :subtitle="monthListSum !== '' ? '合計: ' + monthListSum + ' 円' : ''"
      @prev="movePrev()"
      @next="moveNext()"
    ></PaginationBar>
    <v-row no-gutters class="mb-2">
      <!-- 収入支出 -->
      <v-col class="mb-2 d-flex justify-center">
        <v-btn-toggle
          v-model="isPay"
          variant="outlined"
          density="compact"
          mandatory
          @update:model-value="updateChart"
        >
          <v-btn :value="true" min-width="60">{{ isType ? '支出' : '支払' }}</v-btn>
          <v-btn :value="false" min-width="60">{{ isType ? '収入' : '受取' }}</v-btn>
        </v-btn-toggle>
      </v-col>
      <!-- カテゴリ方法 -->
      <v-col class="mb-2 d-flex justify-center">
        <v-btn-toggle
          v-model="isType"
          variant="outlined"
          density="compact"
          mandatory
          @update:model-value="updateChart"
        >
          <v-btn :value="true" min-width="64" class="px-0">カテゴリ</v-btn>
          <v-btn :value="false" min-width="64" class="px-0">方法</v-btn>
        </v-btn-toggle>
      </v-col>
      <!-- 立替 -->
      <v-col v-if="isExistPair" class="mb-2 d-flex justify-center">
        <v-btn-toggle
          v-model="isIncludeInstead"
          variant="outlined"
          density="compact"
          mandatory
          @update:model-value="updateChart"
        >
          <v-btn :value="true" min-width="64" class="px-0">立替込み</v-btn>
          <v-btn :value="false" min-width="64" class="px-0">除く</v-btn>
        </v-btn-toggle>
      </v-col>

      <!-- 月年 -->
      <!-- TODO 実装 -->
      <!-- <v-col class="mb-2 d-flex justify-center">
        <v-btn-toggle
          v-model="isMonth"
          active-class="blue-grey lighten-1"
          color="white"
          mandatory
          @change="test()"
        >
          <v-btn :value="true" min-width="60">月</v-btn>
          <v-btn :value="false" min-width="60">年</v-btn>
        </v-btn-toggle>
      </v-col> -->
    </v-row>
    <v-row no-gutters class="mb-3 text-center">
      <div v-if="pieData.labels.length !== 0" class="w-100">
        <Pie :data="pieData" :options="pieOptions" />
      </div>
      <div v-else-if="isEndInit" class="mt-30px w-100 text-center">表示するデータがありません</div>
    </v-row>
    <div>
      <v-row
        v-for="typeOrMethod of typeOrMethodList"
        :key="typeOrMethod.id"
        class="mb-2"
        no-gutters
      >
        <v-col>
          <v-card variant="outlined" class="card-border">
            <v-row no-gutters>
              <v-col cols="7" class="py-1 pl-1 d-flex align-center">
                <!-- TODO records と 共通化 -->
                <v-card-subtitle v-if="isType" class="py-0 pl-2">
                  <v-avatar
                    size="25"
                    :color="typeOrMethod.color"
                    :icon="typeOrMethod.isPair ? $ICONS.SHARE : ''"
                    class="text-white"
                  >
                  </v-avatar>
                  {{ typeOrMethod.name }}
                </v-card-subtitle>
                <v-card-subtitle v-else class="py-0 pl-2">
                  <div>
                    <v-row no-gutters class="d-flex align-center">
                      <v-icon
                        v-if="typeOrMethod.isPair && !typeOrMethod.pairUserName"
                        class="mr-2"
                        >{{ $ICONS.SHARE }}</v-icon
                      >
                      <span v-else-if="isPair && typeOrMethod.pairUserName" class="mr-2 fs-sm">
                        {{ typeOrMethod.pairUserName }}
                      </span>
                      <span :class="`${typeOrMethod.color}--text`">{{ typeOrMethod.name }}</span>
                    </v-row>
                  </div>
                </v-card-subtitle>
              </v-col>
              <v-col cols="4" class="py-1 d-flex align-center justify-center">
                <div class="py-0 pr-2">
                  {{ typeOrMethod.value + ' 円' }}
                </div>
              </v-col>
              <v-col cols="1" class="pa-0 d-flex align-center justify-end">
                <v-btn
                  icon
                  block
                  size="small"
                  variant="flat"
                  class="font-weight-bold"
                  @click="
                    goRecordsShowPage(
                      typeOrMethod.id,
                      typeOrMethod.name,
                      typeOrMethod.color,
                      typeOrMethod.pairUserName,
                      null
                    )
                  "
                  >＞</v-btn
                >
              </v-col>
            </v-row>
            <v-divider v-if="typeOrMethod.subs.length != 0" class="mb-1" />
            <v-row no-gutters class="px-2">
              <v-col v-for="subtype of typeOrMethod.subs" :key="subtype.id" cols="12" class="pl-4">
                <v-row no-gutters>
                  <v-col cols="5" class="fs-sm d-flex align-center">
                    {{ subtype.name }}
                  </v-col>
                  <v-col cols="6" class="pr-1 d-flex justify-end align-center">
                    {{ subtype.value + ' 円' }}
                  </v-col>
                  <v-col cols="1" class="pa-0 d-flex align-center justify-end">
                    <v-btn
                      icon
                      block
                      size="small"
                      variant="flat"
                      class="font-weight-bold"
                      @click="
                        goRecordsShowPage(
                          typeOrMethod.id,
                          typeOrMethod.name + (subtype.name ? ' ー ' + subtype.name : ''),
                          typeOrMethod.color,
                          null,
                          subtype.id
                        )
                      "
                      >＞</v-btn
                    >
                  </v-col>
                </v-row>
              </v-col>
            </v-row>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import TimeUtility from '@/utils/time';
import StringUtility from '@/utils/string';
import {
  dummy,
  page,
  type GetMethodSummaryRpc,
  type GetTypeSummaryOutput,
  type YearMonthObj,
} from '@/types/common';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'vue-chartjs';
ChartJS.register(ArcElement, Tooltip, Legend);

type PieData = {
  labels: string[];
  datasets: [
    {
      data: number[];
      backgroundColor: string[];
    }
  ];
};
type TypeListSubs = { name: string; value: string; id: number };
type TypeOrMethod = {
  name: string;
  value: string;
  color: string;
  id: number;
  isPair: boolean;
  pairUserName: string | null;
  subs: TypeListSubs[];
};
type TypeOrMethodList = TypeOrMethod[];
export type PieShowSetting = {
  isPay: boolean;
  isType: boolean;
  isMonth: boolean;
  focus: YearMonthObj;
};
const pieOptions = {
  responsive: true,
  maintainAspectRatio: false,
} as const;

type Props = {
  showSetting: PieShowSetting;
};

const { enableLoading, disableLoading } = useLoadingStore();
const [loginStore, pairStore, userStore] = [useLoginStore(), usePairStore(), useUserStore()];
const { isDemoLogin } = storeToRefs(loginStore);
const { isPair, pairId } = storeToRefs(pairStore);
const { userUid } = storeToRefs(userStore);
const { getMethodSummary, getTypeSummary } = useSupabase();
const router = useRouter();

const focus = ref<YearMonthObj>(TimeUtility.GetNowYearMonthObj(isDemoLogin.value));
const monthListSum = ref('');
const isPay = ref(true);
const isMonth = ref(true);
const isType = ref(true);
const isIncludeInstead = ref(true);
const typeOrMethodList = ref<TypeOrMethodList>([]);
const isEndInit = ref(false);
const pieData = ref<PieData>({
  labels: [],
  datasets: [
    {
      data: [],
      backgroundColor: [],
    },
  ],
});

const props = defineProps<Props>();

const focusPeriod = computed(() => {
  if (isMonth.value) {
    return TimeUtility.ConvertYearMonthObjToJPYearMonth(focus.value);
  } else {
    return TimeUtility.ConvertYearMonthObjToJPYear(focus.value);
  }
});

const isExistPair = computed(() => !!pairId);

const updateShowSetting = (setting: PieShowSetting) => {
  isPay.value = setting.isPay;
  isType.value = setting.isType;
  isMonth.value = setting.isMonth;
  focus.value = setting.focus;
};
const movePrev = async () => {
  focus.value = TimeUtility.PrevMonthInYearMonthObj(focus.value);
  await updateChart();
};
const moveNext = async () => {
  focus.value = TimeUtility.NextMonthInYearMonthObj(focus.value);
  await updateChart();
};
const updateChart = async () => {
  enableLoading();

  const payload = {
    isPay: isPay.value,
    isPair: isPair.value,
    isIncludeInstead: isExistPair.value ? isIncludeInstead.value : false,
    year: focus.value.year,
    month: focus.value.month,
  };
  let apiRes;
  let sum: number = 0;
  if (isType.value) {
    apiRes = await getTypeSummary(
      { isDemoLogin: isDemoLogin.value, userUid: userUid.value ?? dummy.str },
      payload
    );
  } else {
    apiRes = await getMethodSummary(
      { isDemoLogin: isDemoLogin.value, userUid: userUid.value ?? dummy.str },
      payload
    );
  }
  if (apiRes.error !== null) {
    alert(apiRes.message + `(Error: ${JSON.stringify(apiRes.error)})`);
    return;
  }
  sum = getTypeOrMethodSum(apiRes.data ?? []);
  monthListSum.value = StringUtility.ConvertIntToShowStrWithIsPay(sum, isPay.value);
  const { pie, list } = convertShowData(apiRes.data ?? []);
  [pieData.value, typeOrMethodList.value] = [pie, list];

  disableLoading();
};
const getTypeOrMethodSum = (monthSummary: any[]) => {
  return monthSummary.reduce((sum, item) => {
    return sum + item.sum;
  }, 0);
};
const convertShowData = (monthSummary: GetTypeSummaryOutput[] | GetMethodSummaryRpc[]) => {
  let pieData: PieData = { labels: [], datasets: [{ data: [], backgroundColor: [] }] };
  let typeOrMethodList: TypeOrMethodList = [];
  monthSummary.forEach((typeOrMethodSummary, index) => {
    const sum = typeOrMethodSummary.sum ?? 0;
    if (sum === 0) return;

    const id = isType.value
      ? (typeOrMethodSummary as GetTypeSummaryOutput).type_id
      : (typeOrMethodSummary as GetMethodSummaryRpc).method_id;
    const name = isType.value
      ? (typeOrMethodSummary as GetTypeSummaryOutput).type_name
      : (typeOrMethodSummary as GetMethodSummaryRpc).method_name;
    const color = typeOrMethodSummary.color_name;
    const isPair = typeOrMethodSummary.is_pair;
    const pairUserName = isType.value
      ? ''
      : (typeOrMethodSummary as GetMethodSummaryRpc).pair_user_name;

    // 円グラフデータの格納
    pieData.datasets[0].data.push(sum);
    pieData.datasets[0].backgroundColor.push(color);
    pieData.labels.push(name);

    // リストデータの格納
    let typeOrMethod: TypeOrMethod = {
      name: name,
      value: StringUtility.ConvertIntToShowStr(sum),
      color: color,
      id: id,
      isPair: isPair,
      pairUserName: pairUserName,
      subs: [],
    };

    // sub_type がある場合を考慮
    if (isType.value) {
      ((typeOrMethodSummary as GetTypeSummaryOutput).sub_types ?? []).forEach((subTypeObj: any) => {
        typeOrMethod.subs.push({
          name: subTypeObj.sub_type_name,
          value: StringUtility.ConvertIntToShowStr(subTypeObj.sub_type_sum),
          id: subTypeObj.sub_type_id,
        });
      });
    }

    typeOrMethodList.push(typeOrMethod);
  });

  return { pie: pieData, list: typeOrMethodList };
};
const goRecordsShowPage = (
  typeOrMethodId: number,
  name: string,
  color: string,
  pairUserName: string | null,
  subtypeId: number | null
) => {
  // TODO 訂正
  router.push({
    name: page.RECORDS,
    // params: {
    //   id: typeOrMethodId,
    //   subtypeId: subtypeId,
    //   isPay: this.isPay,
    //   isMonth: this.isMonth,
    //   isType: this.isType,
    //   isPair: this.isPair,
    //   isIncludeInstead: this.isExistPair ? this.isIncludeInstead : null,
    //   focus: this.focus,
    //   name: name,
    //   color: color,
    //   pairUserName: pairUserName,
    // },
  });
};

// created
(async () => {
  // records 画面からの遷移の場合、遷移元の表示条件に合わせる
  updateShowSetting(props.showSetting);

  await updateChart();

  isEndInit.value = true;
})();

defineExpose({
  updateChart,
});
</script>

<style lang="scss" scoped></style>
