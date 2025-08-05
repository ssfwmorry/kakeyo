<template>
  <v-container class="px-2 pb-0 h-100 bg-white">
    <v-row no-gutters class="mb-3">
      <v-table v-if="tableData.length > 0" density="compact" class="px-3 w-100">
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
            <td class="px-2 text-right">{{ row.sum.toLocaleString() }} 万円</td>
            <td
              v-for="(bank, index) in bankList"
              :key="bank.id"
              class="px-2 text-right"
              :class="{ 'text-grey-lighten-1': row.bankPrices[index]?.isPad === true }"
            >
              {{ row.bankPrices[index]?.price.toLocaleString() ?? '-　' }} 万円
            </td>
          </tr>
        </tbody>
      </v-table>
      <div v-else class="mt-30px w-100 text-center">残高履歴を追加してください</div>
    </v-row>

    <v-row no-gutters class="d-flex justify-end">
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

    <BankBalanceDialog
      v-model="dialog"
      :bankList="bankList"
      @closeDialog="closeDialog"
      @apply="updateShowData"
    />
  </v-container>
</template>

<script setup lang="ts">
import type { GetBankListItem } from '~/api/supabase/bank.interface';
import type { GetBankBalanceListBalanceItem } from '~/api/supabase/bankBalance.interface';
import BankBalanceDialog from '~/components/BankBalanceDialog.vue';
import TimeUtility from '~/utils/time';
import type { DateString } from '~/utils/types/common';

type BankPrice = {
  price: number;
  isPad: boolean; // 補完された値であれば true
} | null; // null は price 未登録を示す
type TableRow = Omit<GetBankBalanceListBalanceItem, 'createdAt' | 'banks'> & {
  createdDate: DateString;
  bankPrices: BankPrice[];
};
type Dialog = {
  isShow: boolean;
};

const { enableLoading, disableLoading } = useLoadingStore();
const authStore = useAuthStore();
const { getBankList, getBankBalanceList } = useSupabase();
const { userUid } = storeToRefs(authStore);

const tableData = ref<TableRow[]>([]);
const bankList = ref<GetBankListItem[]>([]);
const dialog = ref<Dialog>({ isShow: false });

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
  tableData.value = paddingBankBalances(apiResBank.data, apiResBalance.data);
  disableLoading();
};

const paddingBankBalances = (
  banks: GetBankListItem[],
  balances: GetBankBalanceListBalanceItem[]
): TableRow[] => {
  // 万を単位として少数第一位まで
  const convertManUnit = (num: number) => {
    return Math.round(num / 1000) / 10;
  };

  const tableRows: TableRow[] = [];
  balances.forEach((balance, indexBalance) => {
    const tableBankPrices: BankPrice[] = [];
    let padPriceSum = 0; // 補完された金額の合計
    banks.forEach((bank, indexBank) => {
      const bankId = String(bank.id);
      if (bankId in balance.banks) {
        // 存在する値ならそのまま設定
        tableBankPrices.push({
          price: convertManUnit(balance.banks[bankId].price),
          isPad: false,
        });
      } else if (indexBalance === 0) {
        // 最初の値なら null
        tableBankPrices.push(null);
      } else {
        // 前の行のデータを流用する
        const prevPrice = tableRows[indexBalance - 1].bankPrices[indexBank];
        if (prevPrice === null) {
          // 前の行がないなら null
          tableBankPrices.push(null);
        } else {
          // 前の行を補完するので isPad = true
          tableBankPrices.push({ price: prevPrice.price, isPad: true });
          padPriceSum += prevPrice.price;
        }
      }
    });
    tableRows.push({
      createdDate: TimeUtility.ConvertDBResponseDatetimeToDateStr(balance.createdAt),
      bankPrices: tableBankPrices,
      sum: convertManUnit(balance.sum + padPriceSum),
    });
  });
  return tableRows;
};

// created
(async () => {
  await updateShowData();
})();
</script>
