<template>
  <div class="page-tab-item">
    <PaginationBar
      mode="MONTH"
      :subtitle="''"
      :focus="focusObj"
      @prev="movePrev()"
      @next="moveNext()"
      @update="updateFocus"
    ></PaginationBar>
    <v-row no-gutters class="mb-4">
      <v-stepper v-model="step" :items="stepItems" alt-labels hide-actions class="w-100 fs-nml">
        <template v-slot:item.1>
          <v-row no-gutters class="d-flex justify-center">
            <v-btn variant="flat" color="primary" class="text-white" @click="startSettlement()">
              開始
            </v-btn>
          </v-row>
        </template>
        <template v-slot:item.2>
          <div class="mb-2">
            <v-row
              v-for="(selectedRate, selectedRateIndex) of selectedRateList"
              :key="selectedRateIndex"
              no-gutters
              class="mb-1 d-flex flex-column"
            >
              <v-btn
                small
                variant="flat"
                width="70"
                height="30"
                :color="selectedRate.color"
                class="text-white btn-icon mb-2"
                >{{ selectedRate.label }}
              </v-btn>
              <div class="pl-2">
                <v-chip
                  v-for="record of selectedRate.records"
                  :key="record.id"
                  small
                  :outlined="record.isMe"
                  class="mr-1 chip-hover"
                >
                  {{ record.price }}</v-chip
                >
              </div>
              <div class="pl-2 fs-sm black--text text--secondary">
                合計：
                <span>{{ reportedDataByRate[selectedRateIndex].sum.toLocaleString() }}、</span>
                現状：
                <span>{{ reportedDataByRate[selectedRateIndex].asIs.toLocaleString() }}、</span>
                期待：
                <span>{{ reportedDataByRate[selectedRateIndex].toBe.toLocaleString() }}</span>
              </div>
              <v-divider class="mt-1" />
            </v-row>
          </div>
          <v-row no-gutters>
            <div v-if="isExistUnsettledRecord && selectedRateList.length > 0" class="mb-2">
              {{ settlementResult }}
            </div>
          </v-row>
          <v-row no-gutters class="d-flex justify-center">
            <v-btn
              variant="flat"
              color="primary"
              class="mr-4 text-white"
              @click="determineClassification()"
            >
              分類確定
            </v-btn>
            <v-btn variant="text" width="80" @click="cancelClassification()"> キャンセル </v-btn>
          </v-row>
        </template>
        <template v-slot:item.3>
          <div v-if="isExistUnsettledRecord" class="mb-2 text-center">
            結果： {{ settlementResult }}
          </div>
          <v-row v-if="isExistUnsettledRecord" no-gutters class="d-flex justify-center">
            <v-btn variant="flat" color="primary" class="text-white mr-4" @click="endSettlement()">
              完了
            </v-btn>
            <v-btn variant="text" width="80" @click="cancelSettlement()"> キャンセル </v-btn>
          </v-row>
        </template>
      </v-stepper>
    </v-row>

    <!-- TODO おそらくここは固定費なのでアコーディオンにする -->
    <h4 v-if="recordList['COUPLE'].length !== 0">
      ２人：{{ StringUtility.ConvertIntToShowStr(coupleSum) + ' 円' }}
    </h4>
    <v-row v-for="(record, index) in recordList['COUPLE']" :key="index" no-gutters class="mb-2">
      <v-col>
        <RecordCard
          :isDisable="false"
          :isPairType="true"
          :typeColor="record.typeColorClassificationName"
          :typeAndSubtype="StringUtility.typeAndSubtype(record.typeName, record.subTypeName)"
          :isShowPlannedIcon="record.isPlannedRecord"
          :isEnableEdit="false"
          :isPairMethod="true"
          :userName="''"
          :methodColor="record.methodColorClassificationName"
          :methodName="record.methodName"
          :memo="record.memo ?? ''"
          :isShowBlueColorPrice="!record.isPay"
          :price="StringUtility.ConvertIntToShowStrWithIsPay(record.price, record.isPay)"
        ></RecordCard>
      </v-col>
    </v-row>

    <v-row no-gutters>
      <v-col class="pr-2">
        <h4 v-if="recordList['ME'].length !== 0">自分</h4>
        <v-row v-for="(record, index) in recordList['ME']" :key="index" no-gutters class="mb-1">
          <v-col>
            <v-badge
              dot
              :model-value="step == 2 && record.isNew && !record.isSettled"
              class="w-100"
            >
              <RecordCardHalf
                :labelColor="record.labelColor"
                :backgroundColor="record.backgroundColor"
                :typeColor="record.typeColorClassificationName"
                :typeAndSubtype="StringUtility.typeAndSubtype(record.typeName, record.subTypeName)"
                :isShowPlannedIcon="record.isPlannedRecord"
                :isSettled="record.isSettled ?? false"
                :memo="record.memo ?? ''"
                :isShowBlueColorPrice="!record.isPay"
                :price="StringUtility.ConvertIntToShowStrWithIsPay(record.price, record.isPay)"
                @click.native="openDialog(record, true)"
                class="w-100"
              ></RecordCardHalf>
            </v-badge>
          </v-col>
        </v-row>
      </v-col>

      <v-col class="pl-2 col-border">
        <h4 v-if="recordList['PARTNER'].length !== 0">相手</h4>
        <v-row
          v-for="(record, index) in recordList['PARTNER']"
          :key="index"
          no-gutters
          class="mb-1"
        >
          <v-col>
            <v-badge
              dot
              :model-value="step == 2 && record.isNew && !record.isSettled"
              class="w-100"
            >
              <RecordCardHalf
                :labelColor="record.labelColor"
                :backgroundColor="record.backgroundColor"
                :typeColor="record.typeColorClassificationName"
                :typeAndSubtype="StringUtility.typeAndSubtype(record.typeName, record.subTypeName)"
                :isShowPlannedIcon="record.isPlannedRecord"
                :isSettled="record.isSettled ?? false"
                :memo="record.memo ?? ''"
                :isShowBlueColorPrice="!record.isPay"
                :price="StringUtility.ConvertIntToShowStrWithIsPay(record.price, record.isPay)"
                @click.native="openDialog(record, false)"
                class="w-100"
              ></RecordCardHalf>
            </v-badge>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <SettlementSelectRateDialog
      v-model="dialog"
      @changeRate="changeRate"
      @closeDialog="closeDialog"
    />
  </div>
</template>

<script setup lang="ts">
import type { GetPairedRecordItem } from '@/api/supabase/record.interface';
import type { DialogInfo } from '@/components/SettlementSelectRateDialog.vue';
import { assertApiResponse } from '@/utils/api';
import {
  RATE_BACKGROUND_COLOR_LIST,
  RATE_COLOR_LIST,
  RATE_LABEL_LIST,
  RATE_LIST,
  type RateColorString,
} from '@/utils/constants/color';
import StringUtility from '@/utils/string';
import TimeUtility from '@/utils/time';
import type { Id, YearMonthNumObj, YearMonthObj } from '@/utils/types/common';

const { enableLoading, disableLoading } = useLoadingStore();
const authStore = useAuthStore();
const { isDemoLogin, userUid } = storeToRefs(authStore);
const { getPairedRecordList, settleRecords: supabaseSettleRecords } = useSupabase();
const { setToast } = useToastStore();

const stepStatus = {
  READY: 1,
  GOING: 2,
  DONE: 3,
} as const;
const stepItems: (keyof typeof stepStatus)[] = ['READY', 'GOING', 'DONE'];
type StepStatus = (typeof stepStatus)[keyof typeof stepStatus];
type RateList = {
  colorIndex: number;
  label: string;
  color: RateColorString;
  records: { id: Id; price: number; isMe: boolean }[];
}[];
type Record = {
  labelColor: string | null;
  backgroundColor: string | null;
  isNew: boolean;
} & GetPairedRecordItem;
type RecordList = {
  ME: Record[];
  PARTNER: Record[];
  COUPLE: Record[];
};
type Dialog = {
  isShow: boolean;
  id: Id | null;
  isMe: boolean | null;
};

const focus = ref<YearMonthObj>(TimeUtility.GetNowYearMonthObj(isDemoLogin.value));
const step = ref<StepStatus>(stepStatus.READY);
const selectedRateList = ref<RateList>([]);
const isExistUnsettledRecord = ref(false);
const coupleSum = ref(0);
const recordList = ref<RecordList>({ ME: [], PARTNER: [], COUPLE: [] });
const dialog = ref<Dialog>({
  isShow: false,
  id: null,
  isMe: null,
});

const focusObj = computed(() => TimeUtility.ConvertYearMonthObjToYearMonthNumObj(focus.value));
const reportedDataByRate = computed(() => {
  let ret = [];

  for (const rate of selectedRateList.value) {
    let sum = 0;
    let sumMe = 0;
    for (const record of rate.records) {
      sum += record.price;
      if (record.isMe) sumMe += record.price;
    }

    const toBe = Math.round(sum * RATE_LIST[rate.colorIndex]);
    ret.push({
      sum,
      asIs: sumMe,
      toBe,
      diff: toBe - sumMe, // 本来払うべき金額から実際に払った金額を減らす、つまりまだ払っていない金額
    });
  }

  return ret;
});
const settlementResult = computed(() => {
  const ret = reportedDataByRate.value.reduce((sum, info) => sum + info.diff, 0);
  const getOrPresent = ret > 0 ? 'お渡し' : '受け取り';
  return Math.abs(ret).toLocaleString() + '円の' + getOrPresent;
});

const movePrev = async () => {
  focus.value = TimeUtility.PrevMonthInYearMonthObj(focus.value);
  await updateChart();
};
const moveNext = async () => {
  focus.value = TimeUtility.NextMonthInYearMonthObj(focus.value);
  await updateChart();
};
const updateFocus = async (obj: YearMonthNumObj) => {
  focus.value = TimeUtility.ConvertYearMonthNumObjToYearMonthObj(obj);
  await updateChart();
};
const updateChart = async () => {
  enableLoading();

  const payload = {
    yearMonth: TimeUtility.ConvertYearMonthObjToYearMonth(focus.value),
  };
  const apiRes = await getPairedRecordList(
    { isDemoLogin: isDemoLogin.value, userUid: userUid.value },
    payload
  );
  assertApiResponse(apiRes);

  const {
    coupleSum: ret1,
    recordList: ret2,
    isExistUnsettledRecord: ret3,
  } = convertShowData(apiRes.data);
  coupleSum.value = ret1;
  recordList.value = ret2;
  isExistUnsettledRecord.value = ret3;
  selectedRateList.value = [];

  step.value = isExistUnsettledRecord.value ? stepStatus.READY : stepStatus.DONE;
  disableLoading();
};
const convertShowData = (records: GetPairedRecordItem[]) => {
  let coupleSum = 0;
  let recordList: RecordList = {
    ['ME']: [],
    ['PARTNER']: [],
    ['COUPLE']: [],
  };

  let isExistUnsettledRecord = false;
  records.forEach((tmpRecord) => {
    const record: Record = {
      ...tmpRecord,
      labelColor: null,
      backgroundColor: null,
      isNew: true,
    };

    if (record.isSettled === false) isExistUnsettledRecord = true;

    let recordPrice;
    if (record.isSettled || record.price === 0) {
      recordPrice = 0;
    } else if (record.isPay) {
      recordPrice = record.price;
    } else {
      recordPrice = record.price * -1;
    }

    if (record.isSelf) {
      // ME
      recordList['ME'].push(record);
    } else if (!record.isInstead) {
      // COUPLE
      recordList['COUPLE'].push(record);
      coupleSum += recordPrice;
    } else {
      // PARTNER
      recordList['PARTNER'].push(record);
    }
  });

  return { coupleSum, recordList, isExistUnsettledRecord };
};
const startSettlement = () => {
  step.value = stepStatus.GOING;
};
const cancelClassification = () => {
  step.value = stepStatus.READY;

  // RecordCardHalf の表示
  for (const e of ['ME', 'COUPLE', 'PARTNER'] as (keyof RecordList)[]) {
    (recordList.value[e] ?? []).forEach((record, i) => {
      recordList.value[e][i].labelColor = null;
      recordList.value[e][i].backgroundColor = null;
      recordList.value[e][i].isNew = true;
    });
  }
  // selectedRateList の表示
  selectedRateList.value = [];
};
const determineClassification = () => {
  step.value = stepStatus.DONE;
};
const cancelSettlement = () => {
  step.value = stepStatus.GOING;
};
const endSettlement = async () => {
  await settleRecords();
  step.value = stepStatus.READY;
};
const settleRecords = async () => {
  enableLoading();

  const idList = getRecordIdList(selectedRateList.value);

  const apiRes = await supabaseSettleRecords({ isDemoLogin: isDemoLogin.value }, { ids: idList });
  if (apiRes.error !== null) {
    if (apiRes.error === 'no id') {
      alert('データがありません。');
      disableLoading();
      return;
    }
    assertApiResponse(apiRes);
    return;
  }

  // MEMO: 二重にローディングしている
  await updateChart();
  setToast('変更しました');
};
const getRecordIdList = (selectedRateList: RateList) => {
  let ret = [];
  for (const rate of selectedRateList) {
    for (const record of rate.records) {
      ret.push(record.id);
    }
  }
  return ret;
};
const openDialog = (record: Record, isMe: boolean) => {
  if (step.value !== stepStatus.GOING || record.isSettled) return;

  dialog.value = {
    isShow: true,
    id: record.id,
    isMe,
  };
};
const closeDialog = () => {
  dialog.value = {
    isShow: false,
    id: null,
    isMe: null,
  };
};
const changeRate = (dialogInfo: DialogInfo) => {
  if (dialogInfo.id === null) {
    alert('予期せぬ状態');
    return;
  }
  dialog.value.isShow = false;

  // すでにselectedRateListに登録済みデータを削除する
  deleteRecordInSelectedRateList(dialogInfo.id);

  for (const e of ['ME', 'COUPLE', 'PARTNER'] as (keyof RecordList)[]) {
    const index = recordList.value[e].findIndex((record) => record.id === dialogInfo.id);
    if (index === -1) continue;

    // RecordCardHalf の表示
    recordList.value[e][index].labelColor = RATE_COLOR_LIST[dialogInfo.colorIndex];
    recordList.value[e][index].backgroundColor = RATE_BACKGROUND_COLOR_LIST[dialogInfo.colorIndex];
    recordList.value[e][index].isNew = dialogInfo.colorIndex === null;

    // selectedRateList の表示
    // TODO isPay=falseを考慮
    const colorIndex = selectedRateList.value.findIndex(
      (selectedRate) => selectedRate.colorIndex === dialogInfo.colorIndex
    );
    const record = {
      id: recordList.value[e][index].id,
      price: recordList.value[e][index].price,
      isMe: dialogInfo.isMe ?? false,
    };
    if (colorIndex === -1) {
      // 新規追加
      selectedRateList.value.push({
        colorIndex: dialogInfo.colorIndex,
        label: RATE_LABEL_LIST[dialogInfo.colorIndex],
        color: RATE_COLOR_LIST[dialogInfo.colorIndex],
        records: [record],
      });
    } else {
      // すでにある場合
      selectedRateList.value[colorIndex].records.push(record);
    }
  }
};
const deleteRecordInSelectedRateList = (id: Id) => {
  let deleteColor: undefined | string;

  for (let i = 0; i < selectedRateList.value.length; i++) {
    const records = selectedRateList.value[i].records;
    // 指定されたrecordを削除する
    for (let j = 0; j < records.length; j++) {
      const tmpArr = records.filter((e) => e.id !== id);
      selectedRateList.value[i].records = tmpArr;
      if (selectedRateList.value[i].records.length === 0) {
        deleteColor = selectedRateList.value[i].color;
      }
      break;
    }
  }

  // recordsが空になったら、selectedRateList.value[i]も削除する
  if (deleteColor !== undefined) {
    const tmpArr = selectedRateList.value.filter((e) => e.color !== deleteColor);
    selectedRateList.value = tmpArr;
  }
};

// created
(async () => {
  await updateChart();
})();

defineExpose({
  updateChart,
});
</script>

<style scoped lang="scss">
.td-width {
  min-width: 90px;
}
.col-border {
  border-left: thin solid rgba(0, 0, 0, 0.12);
}

:deep(.v-stepper) {
  box-shadow: none !important;
  border: thin solid rgba(0, 0, 0, 0.12);

  .v-stepper-header {
    box-shadow: none;
    border-bottom: thin solid rgba(0, 0, 0, 0.12);

    // 各ステップのdiv
    .v-stepper-item {
      padding: 6px;
      flex-basis: 90px;
    }
    // 各ステップのアイコンの下
    .v-stepper-item__avatar {
      margin-bottom: 4px !important;
    }
    // 数字をつなぐhr
    .v-divider {
      margin: 18px -15px 0;
    }
  }

  // 各ステップのコンテンツ
  .v-stepper-window {
    margin: 0;
    padding: 8px 20px;
  }
}
</style>
