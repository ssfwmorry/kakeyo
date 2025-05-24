<template>
  <div
    v-touch="{
      left: () => moveNext(),
      right: () => movePrev(),
    }"
    class="page-tab-item"
  >
    <PaginationBar
      v-if="isMonth"
      mode="YEAR"
      :subtitle="'合計: ' + (isPayAndIncome ? sumPayAndIncome : sumPay) + ' 円'"
      :focus="focusObj"
      @prev="movePrev()"
      @next="moveNext()"
      @update="updateFocus"
    ></PaginationBar>
    <div v-else class="mt-pagination-bar"></div>
    <v-row no-gutters class="mb-4">
      <!-- 収入支出 -->
      <v-col class="d-flex justify-center">
        <v-btn-toggle v-model="isPayAndIncome" variant="outlined" density="compact" mandatory>
          <v-btn :value="true" min-width="65" class="px-0">収支</v-btn>
          <v-btn :value="false" min-width="65" class="px-0">支出のみ</v-btn>
        </v-btn-toggle>
      </v-col>
      <!-- 立替精算 -->
      <v-col v-if="isExistPair && !isPair" class="mb-2 d-flex justify-center">
        <v-btn-toggle
          v-model="isIncludeInstead"
          variant="outlined"
          density="compact"
          mandatory
          @update:model-value="updateChart()"
        >
          <v-btn :value="true" min-width="64" class="px-0">立替精算</v-btn>
          <v-btn :value="false" min-width="64" class="px-0">自分のみ</v-btn>
        </v-btn-toggle>
      </v-col>

      <!-- 月年 -->
      <!-- TODO 実装 -->
      <!-- <v-col class="d-flex justify-center">
        <v-btn-toggle
          v-model="isMonth"
          active-class="blue-grey lighten-1"
          color="white"
          mandatory
          @change="testAlert()"
        >
          <v-btn :value="true" min-width="60">月</v-btn>
          <v-btn :value="false" min-width="60">年</v-btn>
        </v-btn-toggle>
      </v-col> -->
    </v-row>
    <v-row no-gutters class="text-center">
      <div
        v-if="(isPayAndIncome ? barDataPayAndIncome : barDataPay).labels.length !== 0"
        class="w-100"
      >
        <Bar
          :data="isPayAndIncome ? barDataPayAndIncome : barDataPay"
          :options="(barOptions as any)"
        ></Bar>
      </div>
      <div v-else class="mt-30px w-100 text-center">表示するデータがありません</div>
    </v-row>

    <v-row no-gutters>
      <v-table density="compact" class="px-3 w-100">
        <thead>
          <tr>
            <th v-for="header in ['月', '支出', '収入', '収支']" :key="header" class="text-left">
              {{ header }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="data in tableData" :key="data.month">
            <td class="text-center">{{ data.month }}</td>
            <td class="text-right">
              {{ data.pay.toLocaleString() }}
            </td>
            <td class="text-right">
              {{ data.income.toLocaleString() }}
            </td>
            <td
              class="text-right"
              :class="
                data.payAndIncome === 0 ? '' : data.payAndIncome > 0 ? 'blue--text' : 'red--text'
              "
            >
              {{ data.payAndIncome.toLocaleString() }}
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import type { GetPayAndIncomeItem } from '@/api/supabase/record.interface';
import { INITIAL_BAR_DATA, MONTH_KEYS, MONTH_LABELS } from '@/utils/constants';
import StringUtility from '@/utils/string';
import TimeUtility from '@/utils/time';
import { type YearMonthNumObj, type YearMonthString } from '@/utils/types/common';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
  type ChartOptions,
} from 'chart.js';
import { Bar } from 'vue-chartjs';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

type BarData = {
  labels: string[];
  datasets: [
    {
      label: '';
      data: number[];
      backgroundColor: string;
    }
  ];
};
type TableData = {
  month: string;
  pay: number;
  income: number;
  payAndIncome: number;
};

const barOptions: ChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    // tooltip: { enabled: false },
  },
} as const;

const { enableLoading, disableLoading } = useLoadingStore();
const [authStore, pairStore] = [useAuthStore(), usePairStore()];
const { isDemoLogin, isExistPair, userUid } = storeToRefs(authStore);
const { isPair } = storeToRefs(pairStore);
const { getPayAndIncomeList } = useSupabase();

const year = ref(TimeUtility.GetNowYear(isDemoLogin.value));
const isPayAndIncome = ref(true);
const isIncludeInstead = ref(true);
const isMonth = ref(true);

const focusObj = computed<YearMonthNumObj>(() => {
  return { year: year.value, month: 0 };
});

const barDataPayAndIncome = ref<BarData>({
  labels: MONTH_LABELS,
  datasets: [INITIAL_BAR_DATA],
});
const sumPayAndIncome = ref('0');
const barDataPay = ref<BarData>({
  labels: MONTH_LABELS,
  datasets: [INITIAL_BAR_DATA],
});
const sumPay = ref('0');
const tableData = ref<TableData[]>([]);

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

const updateChart = async () => {
  enableLoading();

  const payload = {
    year: String(year.value),
    isPair: isPair.value,
    isIncludeInstead: isExistPair.value ? isIncludeInstead.value : false,
  };
  const apiRes = await getPayAndIncomeList({ userUid: userUid.value }, payload);
  assertApiResponse(apiRes);

  const { ret1, ret2, ret3, ret4, ret5 } = convertShowData(apiRes.data);
  barDataPayAndIncome.value = ret1;
  sumPayAndIncome.value = ret2;
  barDataPay.value = ret3;
  sumPay.value = ret4;
  tableData.value = ret5;

  disableLoading();
};
const convertShowData = (
  monthList: GetPayAndIncomeItem[]
): { ret1: BarData; ret2: string; ret3: BarData; ret4: string; ret5: TableData[] } => {
  let tmpSeriesPayAndIncome: number[] = [];
  let tmpSumPayAndIncome = 0;
  let tmpSeriesPay: number[] = [];
  let tmpSumPay = 0;
  let tmpTableData: TableData[] = [];

  // monthList を 'YYYY-MM' を key にして Map にする
  let monthMap: Record<YearMonthString, { paySum: number; incomeSum: number }> = {};
  monthList.forEach((row) => {
    monthMap[row.yearMonth] = { paySum: row.paySum, incomeSum: row.incomeSum };
  });

  // TODO データ格納チェック
  MONTH_KEYS.forEach((monthKey) => {
    const yearMonth = year.value + '-' + monthKey;
    if (!(yearMonth in monthMap)) {
      // リストにない 'YYYY-MM' は sum を0とする
      tmpSeriesPayAndIncome.push(0);
      tmpSeriesPay.push(0);

      tmpTableData.push({
        month: StringUtility.ConvertSuppressZero(monthKey),
        pay: 0,
        income: 0,
        payAndIncome: 0,
      });

      return;
    }
    const monthSummary = monthMap[yearMonth];
    const monthPayAndIncome = monthSummary.incomeSum - monthSummary.paySum;

    tmpSeriesPayAndIncome.push(monthPayAndIncome);
    tmpSumPayAndIncome += monthPayAndIncome;

    tmpSeriesPay.push(monthSummary.paySum);
    tmpSumPay += monthSummary.paySum;

    tmpTableData.push({
      month: StringUtility.ConvertSuppressZero(monthKey),
      pay: monthSummary.paySum,
      income: monthSummary.incomeSum,
      payAndIncome: monthPayAndIncome,
    });
  });

  if (tmpSumPayAndIncome === 0 && tmpSumPay === 0) {
    const noneBarData: BarData = {
      labels: MONTH_LABELS,
      datasets: [INITIAL_BAR_DATA],
    };
    return {
      ret1: noneBarData,
      ret2: '0',
      ret3: noneBarData,
      ret4: '0',
      ret5: [],
    };
  }

  const buildBarData = (data: number[]): BarData => {
    return {
      labels: MONTH_LABELS,
      datasets: [
        {
          label: '',
          data,
          backgroundColor: 'rgb(0,0,255)',
        },
      ],
    };
  };

  return {
    ret1: buildBarData(tmpSeriesPayAndIncome),
    ret2: StringUtility.ConvertIntToShowPrefixStr(-1 * tmpSumPayAndIncome), // 表示用に Pay 想定の値を渡す
    ret3: buildBarData(tmpSeriesPay),
    ret4: StringUtility.ConvertIntToShowStr(tmpSumPay),
    ret5: tmpTableData,
  };
};

// created
(async () => {
  await updateChart();
})();

defineExpose({
  updateChart,
});
</script>

<style lang="scss" scoped>
.mt-pagination-bar {
  margin-top: 55px; // <PaginationBar />の高さ分のmarginを設ける
}
</style>
