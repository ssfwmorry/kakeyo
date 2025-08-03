<template>
  <v-dialog
    :model-value="props.modelValue.isShow"
    :transition="false"
    max-width="600"
    @click:outside="closeDialog"
  >
    <v-card class="pa-4">
      <v-row no-gutters class="mb-2">
        <h4 class="mx-auto">残高登録</h4>
      </v-row>
      <div>
        <v-row no-gutters class="my-3">
          <v-col cols="4" class="px-2 text-center">口座名</v-col>
          <v-col cols="8" class="px-2 text-center">残高</v-col>
        </v-row>

        <v-row v-for="(_, index) in balances" :key="index" no-gutters class="my-3">
          <v-col cols="4" class="px-2">
            <v-select
              v-model="balances[index].bankId"
              :items="bankList"
              item-title="name"
              item-value="id"
              density="compact"
              variant="underlined"
              :menu-props="{ maxHeight: 400 }"
              hide-details
              disable-lookup
              single-line
            ></v-select>
          </v-col>
          <v-col cols="8" class="px-2 d-flex">
            <v-number-input
              v-model="balances[index].price"
              inset
              hide-details
              reverse
              prefix="円"
              density="compact"
              control-variant="hidden"
              variant="outlined"
              class="input-price"
            ></v-number-input>
            <div class="ml-2 d-flex align-center">
              <v-btn
                density="compact"
                variant="flat"
                :icon="$ICONS.TRASH"
                @click="balances.splice(index, 1)"
              >
              </v-btn>
            </div>
          </v-col>
        </v-row>

        <v-row no-gutters class="d-flex justify-end align-end mb-1 pr-4">
          <v-btn
            variant="flat"
            rounded
            size="small"
            color="primary"
            :disabled="isDisableAddBalanceBtn()"
            @click="addBalance"
            >＋</v-btn
          >
        </v-row>
        <v-divider class="mb-1" />
      </div>

      <v-card-actions>
        <v-btn
          :loading="loading"
          variant="flat"
          width="80"
          color="primary"
          :disabled="isDisableDialogPostBtn()"
          class="mx-auto"
          @click="apply"
        >
          登録
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import type { GetBankListItem } from '~/api/supabase/bank.interface';
import { postBankBalances } from '~/api/supabase/bankBalance';
import type { BankBalance } from '~/utils/types/model';

const authStore = useAuthStore();
const { isDemoLogin } = storeToRefs(authStore);
const { setToast } = useToastStore();

type Props = {
  bankList: GetBankListItem[];
  modelValue: {
    isShow: boolean;
  };
};

type Balance = {
  bankId: BankBalance['bankId'] | null;
  price: BankBalance['price'] | null;
};

const props = defineProps<Props>();
const emits = defineEmits();

const balances = ref<Balance[]>([
  {
    bankId: null,
    price: 0,
  },
]);
const loading = ref(false);

const isDisableDialogPostBtn = () => {
  if (balances.value.length === 0) return true;
  return balances.value.some(
    (balance) => balance.bankId === null || balance.price === null || balance.price <= 0
  );
};
const isDisableAddBalanceBtn = () => {
  return balances.value.length >= props.bankList.length;
};

const addBalance = () => {
  balances.value.push({
    bankId: null,
    price: 0,
  });
};

const closeDialog = () => {
  emits('closeDialog');
};
const apply = async () => {
  if (!isBankUnique(balances.value)) {
    setToast('同じ口座は登録できません。', 'error');
    return;
  }

  loading.value = true;

  const apiRes = await postBankBalances(
    { isDemoLogin: isDemoLogin.value },
    { balances: balances.value }
  );
  assertApiResponse(apiRes);

  setToast('登録しました');
  emits('closeDialog');
  loading.value = false;
  await emits('apply');
};
const isBankUnique = (
  balances: Balance[]
): balances is (Balance & { bankId: number; price: number })[] => {
  const bankIds = balances.map((balance) => balance.bankId);
  return new Set(bankIds).size === bankIds.length;
};
</script>

<style lang="scss" scoped>
:deep(.input-price .v-field__input) {
  padding: 0 5px;
}
:deep(.input-price .v-text-field__prefix) {
  padding: 0 5px;
}
</style>
