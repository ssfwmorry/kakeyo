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
      :title="year + '年'"
      :subtitle="'合計: ' + (isPayAndIncome ? sumPayAndIncome : sumPay) + ' 円'"
      @prev="movePrev()"
      @next="moveNext()"
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
      <!-- 立替 -->
      <v-col v-if="isExistPair" class="mb-2 d-flex justify-center">
        <v-btn-toggle
          v-model="isIncludeInstead"
          variant="outlined"
          density="compact"
          mandatory
          @update:model-value="updateChart()"
        >
          <v-btn :value="true" min-width="64" class="px-0">立替込み</v-btn>
          <v-btn :value="false" min-width="64" class="px-0">除く</v-btn>
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
      <v-table dense class="px-3 w-100">
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
import TimeUtility from '@/utils/time';
import StringUtility from '@/utils/string';
import { dummy, type GetPayAndIncomeListRpc, type YearMonthString } from '~/types/common';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
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
const initialBarDataset = {
  label: '' as '',
  data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  backgroundColor: 'rgb(0,0,0)',
};
const MonthLabels = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12(月)'];
const MonthKeys = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

const barOptions: ChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    // tooltip: { enabled: false },
  },
} as const;

const { enableLoading, disableLoading } = useLoadingStore();
const [loginStore, pairStore, userStore] = [useLoginStore(), usePairStore(), useUserStore()];
const { isDemoLogin } = storeToRefs(loginStore);
const { isPair, pairId } = storeToRefs(pairStore);
const { userUid } = storeToRefs(userStore);
const { getPayAndIncomeList } = useSupabase();

const year = ref(TimeUtility.GetNowYear(isDemoLogin.value));
const isPayAndIncome = ref(true);
const isIncludeInstead = ref(true);
const isMonth = ref(true);

const barDataPayAndIncome = ref<BarData>({
  labels: MonthLabels,
  datasets: [initialBarDataset],
});
const sumPayAndIncome = ref('0');
const barDataPay = ref<BarData>({
  labels: MonthLabels,
  datasets: [initialBarDataset],
});
const sumPay = ref('0');
const tableData = ref<TableData[]>([]);

const isExistPair = computed(() => !!pairId);

const movePrev = async () => {
  year.value = TimeUtility.PrevYear(year.value);
  await updateChart();
};
const moveNext = async () => {
  year.value = TimeUtility.NextYear(year.value);
  await updateChart();
};

const updateChart = async () => {
  enableLoading();

  const payload = {
    year: String(year.value),
    isPair: isPair.value,
    isIncludeInstead: isExistPair.value ? isIncludeInstead.value : false,
  };
  const apiRes = await getPayAndIncomeList(
    { isDemoLogin: isDemoLogin.value, userUid: userUid.value ?? dummy.str },
    payload
  );
  if (apiRes.error !== null) {
    alert(apiRes.message + `(Error: ${apiRes.error})`);
    return;
  }

  const { ret1, ret2, ret3, ret4, ret5 } = convertShowData(apiRes.data);
  barDataPayAndIncome.value = ret1;
  sumPayAndIncome.value = ret2;
  barDataPay.value = ret3;
  sumPay.value = ret4;
  tableData.value = ret5;

  disableLoading();
};
const convertShowData = (
  monthList: GetPayAndIncomeListRpc[]
): { ret1: BarData; ret2: string; ret3: BarData; ret4: string; ret5: TableData[] } => {
  let tmpSeriesPayAndIncome: number[] = [];
  let tmpSumPayAndIncome = 0;
  let tmpSeriesPay: number[] = [];
  let tmpSumPay = 0;
  let tmpTableData: TableData[] = [];

  // monthList を 'YYYY-MM' を key にして Map にする
  let monthMap: Record<YearMonthString, { paySum: number; incomeSum: number }> = {};
  monthList.forEach((row) => {
    monthMap[row.year_month] = { paySum: row.pay_sum, incomeSum: row.income_sum };
  });

  // TODO データ格納チェック
  MonthKeys.forEach((monthKey) => {
    const yearMonth = year.value + '-' + monthKey;
    if (!IsValidKeyValue(monthMap, yearMonth)) {
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
      labels: MonthLabels,
      datasets: [initialBarDataset],
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
      labels: MonthLabels,
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
