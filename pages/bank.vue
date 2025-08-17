<template>
  <v-container class="px-2 pb-0 h-100 bg-white">
    <v-row no-gutters class="mb-1">
      <Line :data="chartData" :options="chartOptions" />
    </v-row>

    <v-row no-gutters class="d-flex justify-end mb-2">
      <v-btn
        variant="flat"
        rounded
        color="primary"
        height="38"
        width="80px"
        class="px-4"
        @click="openDialog"
      >
        履歴＋</v-btn
      >
    </v-row>

    <v-row no-gutters>
      <v-card v-if="tableData.length > 0" variant="outlined" class="card-border px-3 w-100">
        <v-table density="compact">
          <thead>
            <tr>
              <th class="px-0 text-center">記録日</th>
              <th class="px-2 text-center">合計</th>
              <th v-for="bank in bankList" :key="bank.id" class="px-2 text-center">
                {{ bank.name }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in tableData" :key="row.createdDate">
              <td class="px-0 text-center">
                {{ row.createdDate }}
              </td>
              <td class="px-2 text-right">{{ row.sum?.toLocaleString() ?? '-　' }} 万円</td>
              <td v-for="(bank, index) in bankList" :key="bank.id" class="px-2 text-right">
                {{ row.bankPrices[index]?.toLocaleString() ?? '-　' }} 万円
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card>
      <div v-else class="mt-30px w-100 text-center">残高履歴を追加してください</div>
    </v-row>

    <BankBalanceDialog
      v-model="dialog"
      :bankList="bankList"
      @closeDialog="closeDialog"
      @apply="updateShowData"
    />
  </v-container>
</template>

<script setup lang="ts">
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  TimeScale,
  Title,
  Tooltip,
  type ChartOptions,
  type Point,
} from 'chart.js';
import 'chartjs-adapter-dayjs-4/dist/chartjs-adapter-dayjs-4.esm';
import dayjs from 'dayjs';
import { Line } from 'vue-chartjs';
import type { GetBankListItem } from '~/api/supabase/bank.interface';
import type { GetBankBalanceListBalanceItem } from '~/api/supabase/bankBalance.interface';
import BankBalanceDialog from '~/components/BankBalanceDialog.vue';
import { COLOR_CODE } from '~/utils/constants/color';
import { convertManUnit } from '~/utils/others';
import TimeUtility from '~/utils/time';
import type { DateString } from '~/utils/types/common';
ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);
type TableRow = Omit<GetBankBalanceListBalanceItem, 'createdAt' | 'banks' | 'sum'> & {
  createdDate: DateString;
  sum: number | null;
  // null は price 未登録を示す
  bankPrices: (number | null)[];
};
type Dialog = {
  isShow: boolean;
};

type LineData = {
  datasets: {
    label: string;
    data: Point[];
    backgroundColor: string;
    fill: true;
    tension: 0.2;
  }[];
};
const chartOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: {
      type: 'time',
      time: { unit: 'month', displayFormats: { month: 'YYYY/MM' }, tooltipFormat: 'YYYY/MM/DD' },
    },
    y: {
      stacked: true,
      ticks: {
        callback: (value) => `${convertManUnit(Number(value))}万円`,
      },
    },
  },
} as const;

const { enableLoading, disableLoading } = useLoadingStore();
const authStore = useAuthStore();
const { getBankList, getBankBalanceList } = useSupabase();
const { userUid } = storeToRefs(authStore);

const tableData = ref<TableRow[]>([]);
const bankList = ref<GetBankListItem[]>([]);
const dialog = ref<Dialog>({ isShow: false });
const chartData = ref<LineData>({ datasets: [] });

const openDialog = () => {
  dialog.value.isShow = true;
};
const closeDialog = () => {
  dialog.value.isShow = false;
};

const updateShowData = async () => {
  enableLoading();
  const [apiResBank, apiResBalance] = await Promise.all([
    getBankList({ userUid: userUid.value }),
    getBankBalanceList({ userUid: userUid.value }),
  ]);
  assertApiResponse(apiResBank);
  assertApiResponse(apiResBalance);

  bankList.value = apiResBank.data;
  chartData.value = getChartData(apiResBank.data, apiResBalance.data);
  tableData.value = getTableData(apiResBank.data, apiResBalance.data);
  disableLoading();
};

const getTableData = (
  banks: GetBankListItem[],
  balances: GetBankBalanceListBalanceItem[]
): TableRow[] => {
  const tableRows: TableRow[] = [];
  balances.forEach((balance, indexBalance) => {
    const tableBankPrices: (number | null)[] = [];
    let isHaveNoBank = false;
    banks.forEach((bank) => {
      const bankId = String(bank.id);
      if (bankId in balance.banks) {
        // 存在する値ならそのまま設定
        tableBankPrices.push(convertManUnit(balance.banks[bankId].price));
      } else {
        tableBankPrices.push(null);
        isHaveNoBank = true;
      }
    });
    tableRows.push({
      createdDate: TimeUtility.ConvertDBResponseDatetimeToDateStr(balance.createdAt),
      bankPrices: tableBankPrices,
      sum: isHaveNoBank ? null : convertManUnit(balance.sum),
    });
  });
  return tableRows;
};

const getChartData = (
  banks: GetBankListItem[],
  balances: GetBankBalanceListBalanceItem[]
): LineData => {
  const datasets: LineData['datasets'] = [];
  banks.forEach((bank) => {
    const data: Point[] = [];
    balances.forEach((balance) => {
      if (bank.id in balance.banks) {
        data.push({
          x: dayjs(balance.createdAt).valueOf(),
          y: balance.banks[bank.id].price,
        });
      }
    });
    datasets.push({
      label: bank.name,
      data,
      backgroundColor: COLOR_CODE[bank.colorClassifications.name],
      fill: true,
      tension: 0.2,
    });
  });

  return { datasets };
};
// created
(async () => {
  await updateShowData();
})();
</script>
