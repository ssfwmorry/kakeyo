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
                  :variant="record.isMe ? 'outlined' : 'tonal'"
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
          <div v-if="isExistUnsettledRecord">
            <v-row no-gutters class="mb-3">
              <v-col cols="4"> 分類結果： </v-col>
              <v-col cols="7"> {{ settlementResult }} </v-col>
              <v-spacer />
            </v-row>
            <v-row no-gutters class="mb-3">
              <v-col cols="4" class="d-flex align-center">
                <span>精算方法：</span>
              </v-col>
              <v-col cols="7">
                <v-select
                  v-model="selectedMethodId"
                  :items="methodList"
                  item-title="name"
                  item-value="id"
                  variant="underlined"
                  density="compact"
                  :menu-props="{ maxHeight: 400 }"
                  hide-details
                  disable-lookup
                  :prepend-inner-icon="$ICONS.CREDIT_CARD"
                  single-line
                ></v-select>
              </v-col>
              <v-spacer />
            </v-row>
            <v-row no-gutters class="mb-4">
              <v-col cols="4" class="d-flex align-center">
                <span>精算金額：</span>
              </v-col>
              <v-col cols="7">
                <v-number-input
                  v-model="price"
                  inset
                  hide-details
                  suffix=" 円"
                  density="compact"
                  control-variant="hidden"
                  variant="outlined"
                ></v-number-input>
              </v-col>
              <v-spacer />
            </v-row>
            <v-row no-gutters class="d-flex justify-center">
              <v-btn
                variant="flat"
                color="primary"
                class="text-white mr-4"
                :disabled="selectedMethodId === null || price === null || price <= 0"
                @click="endSettlement()"
              >
                完了
              </v-btn>
              <!-- MEMO: キャンセルはIFによらずに表示する -->
              <v-btn variant="text" width="80" @click="cancelSettlement()"> キャンセル </v-btn>
            </v-row>
          </div>
        </template>
      </v-stepper>
    </v-row>

    <h4 v-if="recordList['COUPLE'].length !== 0">２人</h4>
    <v-row v-for="(record, index) in recordList['COUPLE']" :key="index" no-gutters class="mb-2">
      <v-col>
        <!-- TODO: isSettlement は false固定ではないかも -->
        <!-- MEMO: 精算recordはプラスでもマイナスでもない -->
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
          :isShowBlueColorPrice="!record.isPay || (record.isSettlement === true && !record.isSelf)"
          :isSettlement="record.isSettlement"
          :price="
            StringUtility.ConvertIntToShowStrWithIsPay(
              record.price,
              record.isSettlement === true || record.isPay === null ? true : record.isPay
            )
          "
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
                :datetime="record.datetime"
                :labelColor="record.labelColor"
                :backgroundColor="record.backgroundColor"
                :typeColor="record.typeColorClassificationName"
                :typeAndSubtype="StringUtility.typeAndSubtype(record.typeName, record.subTypeName)"
                :isShowPlannedIcon="record.isPlannedRecord"
                :isSettled="record.isSettled ?? false"
                :memo="record.memo ?? ''"
                :isShowBlueColorPrice="!record.isPay"
                :price="
                  StringUtility.ConvertIntToShowStrWithIsPay(record.price, record.isPay ?? true)
                "
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
                :datetime="record.datetime"
                :labelColor="record.labelColor"
                :backgroundColor="record.backgroundColor"
                :typeColor="record.typeColorClassificationName"
                :typeAndSubtype="StringUtility.typeAndSubtype(record.typeName, record.subTypeName)"
                :isShowPlannedIcon="record.isPlannedRecord"
                :isSettled="record.isSettled ?? false"
                :memo="record.memo ?? ''"
                :isShowBlueColorPrice="!record.isPay"
                :price="
                  StringUtility.ConvertIntToShowStrWithIsPay(record.price, record.isPay ?? true)
                "
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
import { getMethodList } from '@/api/supabase/method';
import type { GetMethodListItem } from '@/api/supabase/method.interface';
import { createSettlementRecord } from '@/api/supabase/record';
import type {
  GetPairedRecordItem,
  InsertSettlementRecordInput,
} from '@/api/supabase/record.interface';
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
const { isDemoLogin, pairId, userUid } = storeToRefs(authStore);
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
const recordList = ref<RecordList>({ ME: [], PARTNER: [], COUPLE: [] });
const methodList = ref<GetMethodListItem[]>([]);
const selectedMethodId = ref<number | null>(null);
const price = ref<number | null>(null);
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
  const apiResRecord = await getPairedRecordList({ userUid: userUid.value }, payload);
  assertApiResponse(apiResRecord);

  const apiResMethod = await getMethodList({ userUid: userUid.value });
  assertApiResponse(apiResMethod);

  const { recordList: ret2, isExistUnsettledRecord: ret3 } = convertShowData(apiResRecord.data);
  recordList.value = ret2;
  methodList.value = apiResMethod.data.both.pair;
  isExistUnsettledRecord.value = ret3;
  selectedRateList.value = [];

  step.value = isExistUnsettledRecord.value ? stepStatus.READY : stepStatus.DONE;
  disableLoading();
};
const convertShowData = (records: GetPairedRecordItem[]) => {
  let recordList: RecordList = {
    ME: [],
    PARTNER: [],
    COUPLE: [],
  };

  records.forEach((tmpRecord) => {
    const record: Record = {
      ...tmpRecord,
      labelColor: null,
      backgroundColor: null,
      isNew: true,
    };

    if (record.isSettlement || !record.isInstead) {
      recordList.COUPLE.push(record);
    } else if (record.isSelf) {
      recordList.ME.push(record);
    } else {
      recordList.PARTNER.push(record);
    }
  });

  return {
    recordList,
    isExistUnsettledRecord: records.some((record) => record.isSettled === false),
  };
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
  selectedMethodId.value = null;
};
const endSettlement = async () => {
  enableLoading();
  if (
    selectedMethodId.value === null ||
    pairId.value === null ||
    price.value === null ||
    price.value < 0
  ) {
    alert('予期せぬ状態');
    return;
  }

  // 精算用のrecordを作成
  const ret = reportedDataByRate.value.reduce((sum, info) => sum + info.diff, 0);
  if (ret !== 0) {
    const payload: InsertSettlementRecordInput = {
      datetime: TimeUtility.ConvertYearMonthObjToEndOfMonthDatetime(focus.value),
      methodId: selectedMethodId.value,
      price: price.value,
      isPay: ret > 0,
    };
    await createSettlementRecord(
      {
        isDemoLogin: isDemoLogin.value,
        userUid: userUid.value,
        pairId: pairId.value,
      },
      payload
    );
  }

  // 精算済みとして複数のrecordを更新
  await settleRecords();

  // MEMO: 二重にローディングしている
  await updateChart();
  setToast('変更しました');
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
