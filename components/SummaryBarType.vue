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
        <div class="d-flex flex-grow-1 align-center mx-2">
          <v-chip-group
            v-model="selectedTypeIndex"
            mandatory
            variant="outlined"
            selected-class="bg-blue-grey-lighten-3"
            @update:model-value="updateChart"
          >
            <v-chip
              v-for="(type, typeIndex) of typeList[isPay ? 'pay' : 'income'][
                isPair ? 'pair' : 'self'
              ]"
              filter
              :key="typeIndex"
              :text="type.typeName"
              size="small"
            ></v-chip>
          </v-chip-group>
        </div>
      </v-col>
    </v-row>
    <v-row no-gutters>
      <div v-if="selectedTypeIndex !== null" class="w-100">
        <Bar :data="barData" :options="(barOptions as any)" />
      </div>
      <div v-else class="mt-30px w-100 text-center">カテゴリを選択してください</div>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { getSubTypeSummary } from '@/api/supabase/record';
import type { GetSubTypeSummaryOutput } from '@/api/supabase/record.interface';
import { getTypeList } from '@/api/supabase/type';
import type { GetTypeListOutputData } from '@/api/supabase/type.interface';
import { INITIAL_BAR_DATA, MONTH_LABELS } from '@/utils/constants';
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

const subTypeColors = ['gold', 'mediumseagreen', 'blueviolet', 'lightpink', 'royalblue'] as const;
const colorGrey = 'grey' as const;
const barOptions: ChartOptions = {
  responsive: true,
  // maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
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
    label: string | '';
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
const selectedTypeIndex = ref<number | null>(null);
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
  selectedTypeIndex.value = null;
};

const updateChart = async () => {
  if (selectedTypeIndex.value === null) return;
  enableLoading();

  const typeId =
    typeList.value[isPay.value ? 'pay' : 'income'][isPair.value ? 'pair' : 'self'][
      selectedTypeIndex.value
    ].typeId;

  const payload = { year: String(year.value), typeId };
  const apiRes = await getSubTypeSummary(payload);
  assertApiResponse(apiRes);

  barData.value = convertShowData(apiRes.data);

  disableLoading();
};

const convertShowData = (summary: Exclude<GetSubTypeSummaryOutput['data'], undefined>) => {
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
