<template>
  <div>
    <PaginationBar
      mode="YEAR"
      :subtitle="''"
      :focus="focusObj"
      @prev="movePrev()"
      @next="moveNext()"
      @update="updateFocus"
    ></PaginationBar>

    <v-row class="mb-3" no-gutters>
      <v-col class="d-flex flex-row align-center">
        <div class="d-flex align-center">
          <v-btn-toggle
            v-model="isPay"
            density="compact"
            variant="outlined"
            mandatory
            @update:model-value="resetTypeList"
          >
            <v-btn :value="true" min-width="60" class="px-0">支出</v-btn>
            <v-btn :value="false" min-width="60" class="px-0">収入</v-btn>
          </v-btn-toggle>
        </div>
        <div class="d-flex flex-grow-1 align-center overflow-x-auto ml-2">
          <v-chip-group
            v-model="selectedTypeIndex"
            mandatory
            variant="outlined"
            selected-class="bg-blue-grey-lighten-3"
            @update:model-value="updateChart"
          >
            <v-chip filter :key="0" text="全て" size="small" />
            <v-chip
              v-for="(type, typeIndex) of typeList[isPay ? 'pay' : 'income'][
                isPair ? 'pair' : 'self'
              ]"
              filter
              :key="typeIndex + 1"
              :text="type.typeName"
              size="small"
            ></v-chip>
          </v-chip-group>
        </div>
      </v-col>
    </v-row>
    <!-- 判例表示 -->
    <v-row no-gutters class="px-1 mb-2">
      <div
        v-for="(dataset, index) in barData.datasets"
        :key="index"
        cols="1"
        class="d-flex align-center mr-4 fs-sm"
      >
        <v-avatar
          tile
          size="12"
          :style="{ backgroundColor: dataset.backgroundColor }"
          class="mr-1"
        />
        {{ dataset.label }}
      </div>
    </v-row>

    <v-row no-gutters>
      <div class="w-100">
        <Bar :data="barData" :options="(barOptions as any)" />
      </div>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { getSubTypeSummary, getTypeSummaryPeriod } from '@/api/supabase/record';
import type {
  GetSubTypeSummaryOutput,
  GetTypeSummaryPeriodOutput,
} from '@/api/supabase/record.interface';
import { getTypeList } from '@/api/supabase/type';
import type { GetTypeListOutputData } from '@/api/supabase/type.interface';
import { INITIAL_BAR_DATA, MONTH_LABELS } from '@/utils/constants';
import { COLOR_CODE } from '@/utils/constants/color';
import TimeUtility from '@/utils/time';
import type { YearMonthNumObj } from '@/utils/types/common';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  Title,
  Tooltip,
  type ChartOptions,
} from 'chart.js';
import { Bar } from 'vue-chartjs';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip);

const subTypeColors = ['gold', 'mediumseagreen', 'blueviolet', 'lightpink', 'royalblue', 'chocolate'] as const; // prettier-ignore
const colorGrey = 'grey' as const;
const allIndex = 0 as const;
const barOptions: ChartOptions = {
  responsive: true,
  // maintainAspectRatio: false,
  plugins: {
    legend: { display: false }, // グラフの凡例を非表示
  },
  scales: {
    x: { stacked: true },
    y: { stacked: true },
  },
} as const;

type BarData = {
  // 月ごとのラベル
  labels: string[];
  // 配列の大きさ: サブカテゴリの数+1(サブカテゴリなし)
  datasets: {
    /** subTypeName */
    label: string;
    /** 月ごとの金額 */
    data: number[];
    /** 棒の色 */
    backgroundColor: (typeof subTypeColors)[number] | typeof colorGrey | string; // TODO: ColorString に準拠
  }[];
};

const { enableLoading, disableLoading } = useLoadingStore();
const [authStore, pairStore] = [useAuthStore(), usePairStore()];
const { isDemoLogin, userUid } = storeToRefs(authStore);
const { isPair } = storeToRefs(pairStore);

const year = ref(TimeUtility.GetNowYear(isDemoLogin.value));
const isPay = ref<boolean>(true);
const selectedTypeIndex = ref<number>(allIndex);
const typeList = ref<GetTypeListOutputData>({
  income: { self: [], pair: [] },
  pay: { self: [], pair: [] },
});
const barData = ref<BarData>({
  labels: MONTH_LABELS,
  datasets: [INITIAL_BAR_DATA],
});

const focusObj = computed<YearMonthNumObj>(() => {
  return { year: year.value, month: 0 };
});

const movePrev = async () => {
  year.value = TimeUtility.PrevYear(year.value);
  await updateChart();
};
const moveNext = async () => {
  year.value = TimeUtility.NextYear(year.value);
  await updateChart();
};
const updateFocus = async (obj: YearMonthNumObj) => {
  year.value = obj.year;
  await updateChart();
};

const resetTypeList = async () => {
  selectedTypeIndex.value = allIndex;
  await updateChart();
};

const updateChart = async () => {
  enableLoading();

  if (selectedTypeIndex.value === allIndex) {
    const payload = { year: String(year.value), isPair: isPair.value, isPay: isPay.value };
    const apiRes = await getTypeSummaryPeriod({ userUid: userUid.value }, payload);
    assertApiResponse(apiRes);

    barData.value = convertShowTypesData(apiRes.data);
  } else {
    const typeId =
      typeList.value[isPay.value ? 'pay' : 'income'][isPair.value ? 'pair' : 'self'][
        selectedTypeIndex.value - 1 // -1 is because the first index (0) is "All"
      ].typeId;

    const payload = { year: String(year.value), typeId };
    const apiRes = await getSubTypeSummary(payload);
    assertApiResponse(apiRes);

    barData.value = convertShowSubTypesData(apiRes.data);
  }

  disableLoading();
};

const convertShowTypesData = (summary: Exclude<GetTypeSummaryPeriodOutput['data'], undefined>) => {
  const datasets: BarData['datasets'] = [];

  // type分のデータを作成
  summary.types.forEach((type, index) => {
    const datasetsData: number[] = [];
    summary.summaries.forEach((summariesItem) => {
      datasetsData.push(summariesItem.types[index].sum ?? 0);
    });
    datasets.push({
      label: type.typeName,
      data: datasetsData,
      backgroundColor: COLOR_CODE[type.colorClassificationName],
    });
  });
  return { labels: MONTH_LABELS, datasets };
};

const convertShowSubTypesData = (summary: Exclude<GetSubTypeSummaryOutput['data'], undefined>) => {
  const datasets: BarData['datasets'] = [];
  // subTypeがない分のデータを作成
  datasets.push({
    label: 'サブカテゴリなし',
    data: summary.summaries.map((item) => item.sum ?? 0),
    backgroundColor: colorGrey,
  });

  // subType分のデータを作成
  summary.subTypes.forEach((subType, index) => {
    const datasetsData: number[] = [];
    summary.summaries.forEach((summariesItem) => {
      datasetsData.push(summariesItem.subTypes[index].sum ?? 0);
    });
    datasets.push({
      label: subType.name,
      data: datasetsData,
      backgroundColor: subTypeColors[index % subTypeColors.length],
    });
  });

  return { labels: MONTH_LABELS, datasets };
};

// created
(async () => {
  // TODO: 「すべて」を追加する。この場合は、カテゴリが積み上げられた、月々の支払/受取の合計を表示する。
  const apiRes = await getTypeList({ userUid: userUid.value });
  assertApiResponse(apiRes);
  typeList.value = apiRes.data;

  await updateChart();
})();

defineExpose({
  resetTypeList,
});
</script>
