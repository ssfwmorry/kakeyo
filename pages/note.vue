<template>
  <v-container class="px-5 h-100 bg-white">
    <v-row class="mb-4 mt-30px" no-gutters>
      <!-- 収入支出 -->
      <v-col>
        <v-btn-toggle
          v-model="isPay"
          density="compact"
          variant="outlined"
          mandatory
          @update:model-value="resetInput"
        >
          <v-btn :value="true">支出</v-btn>
          <v-btn :value="false">収入</v-btn>
        </v-btn-toggle>
      </v-col>
      <!-- 日付選択 -->
      <v-col v-if="isEndInit && isPlannedRecord">
        <v-select
          v-model="selectedDayId"
          density="compact"
          filled
          single-line
          hide-details
          disable-lookup
          :items="dayList"
          item-title="name"
          item-value="id"
          class="select-day-by"
        ></v-select>
      </v-col>
      <v-col v-else-if="isEndInit && !isPlannedRecord">
        <v-btn variant="flat" height="40" class="px-2 fw-nml fs-nml" color="grey-lighten-3">
          <v-icon size="30" color="grey-darken-1" class="pr-1">{{ $ICONS.CALENDAR }}</v-icon>
          {{ date }}
          <v-menu
            v-model="isShowDatePicker"
            max-width="600"
            activator="parent"
            transition="scale-transition"
            :close-on-content-click="false"
          >
            <v-date-picker
              :model-value="date"
              :display-value="date"
              show-adjacent-months
              hide-header
              min="2000-01-01"
              max="2099-12-31"
              @update:model-value="setDate"
            ></v-date-picker>
          </v-menu>
        </v-btn>
      </v-col>
    </v-row>
    <v-row class="mb-4" no-gutters>
      <v-col v-if="isEndSelectType()">
        <!-- タイプ表示 -->
        <v-text-field
          readonly
          hide-details
          variant="underlined"
          :append-inner-icon="isShowTypeClearBtn() ? $ICONS.CLOSE : ''"
          :value="selectedType?.typeName"
          class="text-field-type"
          @click:append-inner="resetInput()"
        ></v-text-field>
      </v-col>
      <v-col v-if="isSelectedTypeHasSubType()">
        <!-- サブタイプ表示 -->
        <v-text-field
          readonly
          hide-details
          variant="underlined"
          :append-inner-icon="isEndSelectTypeAndSubType() ? $ICONS.CLOSE : ''"
          :value="selectedSubType?.subTypeName"
          class="text-field-type"
          @click:append-inner="selectedSubTypeId = null"
        >
          <template v-slot:prepend>
            <div class="ml-4"><span class="fs-lg">＞</span></div>
          </template></v-text-field
        >
      </v-col>
    </v-row>
    <v-row v-if="!isEndSelectType()" class="mb-2" no-gutters>
      <div
        v-if="
          isEndInit && typeList[isPay ? 'pay' : 'income'][isPair ? 'pair' : 'self'].length === 0
        "
        class="w-100 text-center"
      >
        設定画面でカテゴリと方法を追加してください
      </div>
      <!-- タイプ選択 -->
      <v-col
        v-for="type of typeList[isPay ? 'pay' : 'income'][isPair ? 'pair' : 'self']"
        :key="type.typeId"
        cols="3"
        class="mb-1"
      >
        <v-card class="d-flex flex-column" elevation="0">
          <v-card-actions class="justify-center">
            <v-avatar
              size="60"
              :color="type.colorClassificationName"
              @click="selectedTypeId = type.typeId"
            ></v-avatar>
          </v-card-actions>
          <div class="text-center py-0 px-2">{{ type.typeName }}</div>
        </v-card>
      </v-col>
    </v-row>
    <v-row v-if="!isEndSelectTypeAndSubType()" class="mb-2" no-gutters>
      <!-- サブタイプ選択 -->
      <v-col
        v-for="subType of selectedType?.subTypes ?? []"
        :key="subType.subTypeId"
        cols="3"
        class="mb-2 px-1"
      >
        <v-btn
          dark
          variant="flat"
          :color="selectedType?.colorClassificationName ?? ''"
          class="btn-subtype"
          @click="selectedSubTypeId = subType.subTypeId"
          >{{ subType.subTypeName }}</v-btn
        >
      </v-col>
    </v-row>
    <div v-if="isEndSelectTypeAndSubType()">
      <v-row class="mb-4" no-gutters>
        <!-- 手段 -->
        <v-col cols="6">
          <v-select
            v-model="selectedMethodId"
            :items="methodList[isPay ? 'pay' : 'income'][isPair && !isInstead ? 'pair' : 'self']"
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
        <!-- 立替切り替え -->
        <v-spacer />
        <v-col cols="3" class="d-flex align-center">
          <div v-if="isPair">
            <v-checkbox
              v-model="isInstead"
              density="compact"
              hide-details
              label="立替"
              class="pt-0 mt-0"
              @update:model-value="selectedMethodId = null"
            ></v-checkbox>
          </div>
        </v-col>
        <v-spacer />
      </v-row>
      <v-row class="mb-4" no-gutters>
        <!-- メモ -->
        <v-text-field
          v-model="memo"
          placeholder="メモ"
          variant="underlined"
          density="compact"
          hide-details
          :append-inner-icon="memo !== null ? $ICONS.CLOSE : ''"
          @click:append-inner="memo = null"
        />
      </v-row>
      <v-row class="mb-2" no-gutters>
        <v-spacer />
        <!-- 値段表示 -->
        <v-col cols="9">
          <v-text-field
            readonly
            density="compact"
            hide-details
            suffix=" 円"
            height="44"
            variant="outlined"
            :value="price.toLocaleString()"
            class="text-field-price"
            :class="{ 'text-field-price-padding': !isShowInitPrice }"
            :append-inner-icon="price !== 0 ? $ICONS.CLOSE : ''"
            @click:append-inner="price = 0"
          ></v-text-field>
        </v-col>
      </v-row>
      <v-row v-for="i of 3" :key="i" class="mb-1" no-gutters>
        <!-- 電卓 -->
        <v-col
          v-for="j of 3"
          :key="j"
          cols="4"
          :class="{ 'pl-0 pr-1': j === 1, 'pl-1 pr-0': j === 3 }"
        >
          <v-btn
            size="x-large"
            block
            variant="flat"
            color="blue-grey-lighten-4"
            @click="pushPrice(3 * (3 - i) + j)"
            >{{ 3 * (3 - i) + j }}</v-btn
          >
        </v-col>
      </v-row>
      <v-row class="mb-3" no-gutters>
        <v-col cols="8" class="pl-0">
          <v-btn
            size="x-large"
            block
            variant="flat"
            color="blue-grey-lighten-4"
            @click="pushPrice(0)"
            >0</v-btn
          >
        </v-col>
        <v-col cols="4" class="pl-1 pr-0">
          <v-btn
            size="x-large"
            block
            variant="flat"
            color="blue-grey-lighten-4"
            @click="popPrice()"
          >
            <v-icon>{{ $ICONS.BACKSPACE }}</v-icon>
          </v-btn>
        </v-col>
      </v-row>

      <v-row no-gutters>
        <!-- ゴミ箱 -->
        <v-col v-if="id" class="col-btn">
          <v-btn
            variant="flat"
            color="error"
            class="btn-action"
            @click="isPlannedRecord ? deletePlannedRecord() : deleteRecord()"
          >
            <v-icon>{{ $ICONS.TRASH }}</v-icon>
          </v-btn>
        </v-col>
        <v-col v-else-if="!isPlannedRecord">
          <v-checkbox
            v-model="isContinue"
            density="compact"
            hide-details
            label="連続"
            class="pt-0 mt-0"
          ></v-checkbox>
        </v-col>
        <v-spacer />
        <!-- 登録変更 -->
        <v-col cols="5">
          <v-btn
            :loading="loading"
            @click="isPlannedRecord ? upsertPlannedRecord() : upsertRecord()"
            :disabled="!selectedMethodId || (isPair && !memo)"
            size="x-large"
            block
            variant="flat"
            color="primary"
            height="44"
          >
            {{ id === null ? '登録' : '変更' }}
          </v-btn>
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import type { GetMethodListOutput } from '@/api/supabase/method.interface';
import type { GetTypeListOutput } from '@/api/supabase/type.interface';
import { DUMMY, MAX_PRICE, PAGE } from '@/utils/constants';
import TimeUtility from '@/utils/time';
import { Crud, type DateString, type Id, type PickedDate } from '@/utils/types/common';
import type { DayClassification } from '@/utils/types/model';
import {
  routerParamKey,
  type PlannedRecord,
  type Record_,
  type RouterQueryCalendarToNote,
  type RouterQueryNoteToCalendar,
} from '@/utils/types/page';

const { enableLoading, disableLoading } = useLoadingStore();
const [loginStore, pairStore, userStore] = [useLoginStore(), usePairStore(), useUserStore()];
const { isDemoLogin } = storeToRefs(loginStore);
const { isPair, pairId } = storeToRefs(pairStore);
const { userUid } = storeToRefs(userStore);
const { routerParam } = useRouterParamStore();
const { $ICONS } = useNuxtApp();
const route = useRoute();
const router = useRouter();
const {
  getDayClassificationList,
  getMethodList,
  getTypeList,
  upsertRecord: supabaseUpsertRecord,
  upsertPlannedRecord: supabaseUpsertPlannedRecord,
  deleteRecord: supabaseDeleteRecord,
  deletePlannedRecord: supabaseDeletePlannedRecord,
} = useSupabase();
const { setToast } = useToastStore();

const isPlannedRecord = ref(false);
const isEndInit = ref(false);
const isContinue = ref(false);

const isShowDatePicker = ref(false);
const id = ref<Id | null>(null);
const isPay = ref(true);
const date = ref<DateString>(TimeUtility.GetNowDate(isDemoLogin.value));

const receivedRecordDate = ref<string | null>(null);
const selectedDayId = ref<number | null>(null);
const selectedTypeId = ref<Id | null>(null);
const selectedSubTypeId = ref<Id | null>(null);
const memo = ref<string | null>(null);
const selectedMethodId = ref<Id | null>(null);
const isInstead = ref<boolean | null>(true);
const price = ref(0);
const loading = ref(false);
const dayList = ref<DayClassification[]>([]);
const typeList = ref<GetTypeListOutput['data']>({
  income: { self: [], pair: [] },
  pay: { self: [], pair: [] },
});
const methodList = ref<GetMethodListOutput['data']>({
  income: { self: [], pair: [] },
  pay: { self: [], pair: [] },
});

const isShowInitPrice = computed(() => price.value !== 0);
const selectedType = computed(() => {
  if (selectedTypeId.value === null) return null;
  else {
    const type = typeList.value[isPay.value ? 'pay' : 'income'][
      isPair.value ? 'pair' : 'self'
    ].find((e) => e.typeId === selectedTypeId.value);
    return type ?? null;
  }
});
const selectedSubType = computed(() => {
  if (selectedTypeId.value === null || selectedSubTypeId.value === null) return null;
  else {
    const subtype = (selectedType.value?.subTypes ?? []).find(
      (e) => e.subTypeId === selectedSubTypeId.value
    );
    return subtype ?? null;
  }
});

const resetInput = () => {
  selectedTypeId.value = null;
  selectedSubTypeId.value = null;
  initSelectedMethodId();
};
const isEndSelectType = () => {
  return selectedTypeId.value !== null;
};
const isSelectedTypeHasSubType = () => {
  return (selectedType.value?.subTypes ?? []).length > 0;
};
const isShowTypeClearBtn = () => {
  if (isEndSelectType()) {
    if (!isSelectedTypeHasSubType()) return true;
    else {
      if (selectedSubTypeId.value === null) return true;
    }
  }
  return false;
};
// TypeとSubTypeが選択終了しているか
const isEndSelectTypeAndSubType = () => {
  if (isEndSelectType()) {
    if (!isSelectedTypeHasSubType()) return true;
    else {
      if (selectedSubTypeId.value !== null) return true;
    }
  }
  return false;
};
const setDate = (value: string) => {
  const PickedDate = value as unknown as PickedDate;
  // TODO ゼロ埋め処理をUtilsに移行
  const month = ('0' + String(PickedDate.$M + 1)).slice(-2);
  const day = ('0' + String(PickedDate.$D)).slice(-2);
  date.value = `${PickedDate.$y}-${month}-${day}`;
  isShowDatePicker.value = false;
};
const pushPrice = (num: number) => {
  if (price.value === 0) {
    price.value = num;
  } else {
    if (price.value * 10 + num < MAX_PRICE) price.value = price.value * 10 + num;
  }
};
const popPrice = () => {
  price.value = Math.floor(price.value / 10);
};
const initInputData = () => {
  id.value = null;
  isPay.value = true;
  date.value = TimeUtility.GetNowDate(isDemoLogin.value);
  receivedRecordDate.value = null;
  selectedTypeId.value = null;
  selectedSubTypeId.value = null;
  memo.value = null;
  initSelectedMethodId();
  price.value = 0;
};
const initSelectedMethodId = () => {
  const tmpMethodList =
    methodList.value[isPay.value ? 'pay' : 'income'][
      isPair.value && !isInstead.value ? 'pair' : 'self'
    ];
  if (tmpMethodList.length > 0) {
    selectedMethodId.value = tmpMethodList[0].id;
  } else {
    selectedMethodId.value = null;
  }
};
const initSelectedDayId = () => {
  selectedDayId.value = (dayList.value[0] as any).id;
};
const setPageRecord = (record: Record_, c: Crud) => {
  // 新規作成の場合
  if (c === Crud.CREATE) {
    initSelectedMethodId();
    date.value = TimeUtility.ConvertDBResponseDatetimeToDateStr(record.datetime);
    return;
  }

  // 編集の場合
  id.value = record.id;
  isPay.value = record.isPay;
  date.value = TimeUtility.ConvertDBResponseDatetimeToDateStr(record.datetime);
  price.value = record.price;
  memo.value = record.memo;
  selectedMethodId.value = record.methodId;
  isInstead.value = record.isInstead;
  selectedTypeId.value = record.typeId;
  selectedSubTypeId.value = record.subTypeId;
};
const setPagePlannedRecord = async (plannedRecord: PlannedRecord, c: Crud) => {
  isPlannedRecord.value = true;

  const apiRes = await getDayClassificationList({ isDemoLogin: isDemoLogin.value });
  if (apiRes.error !== null) {
    alert(apiRes.message + `(Error: ${JSON.stringify(apiRes.error)})`);
    return;
  }
  dayList.value = apiRes.data;

  // 新規作成の場合
  if (c === Crud.CREATE) {
    initSelectedMethodId();
    initSelectedDayId();
    return;
  }

  // 編集の場合
  id.value = plannedRecord.id;
  isPay.value = plannedRecord.isPay;
  price.value = plannedRecord.price;
  memo.value = plannedRecord.memo ?? null;
  selectedDayId.value = plannedRecord.dayClassificationId;
  selectedMethodId.value = plannedRecord.methodId;
  isInstead.value = !!plannedRecord.pairUserName;
  selectedTypeId.value = plannedRecord.typeId;
  selectedSubTypeId.value = plannedRecord.subTypeId;
};
const upsertRecord = async () => {
  if (!validateRecordAndShowErrorMsg()) return;
  loading.value = true;

  const payload = {
    id: id.value,
    datetime: TimeUtility.ConvertDateStrToDatetime(date.value),
    isPay: isPay.value,
    methodId: selectedMethodId.value ?? DUMMY.NM,
    isInstead: isInstead.value,
    typeId: selectedTypeId.value ?? DUMMY.NM,
    subTypeId: selectedSubTypeId.value,
    price: price.value,
    memo: memo.value,
  };
  const apiRes = await supabaseUpsertRecord(
    {
      isDemoLogin: isDemoLogin.value,
      userUid: userUid.value ?? DUMMY.STR,
      isPair: isPair.value,
      pairId: pairId.value ?? DUMMY.NM,
    },
    payload
  );
  if (apiRes.error !== null) {
    alert(apiRes.message + `(Error: ${JSON.stringify(apiRes.error)})`);
    return;
  }

  if (isContinue.value) {
    setToast('登録しました');
    initInputData();
  } else {
    setToast(id.value === null ? '登録しました' : '変更しました');
    const query: RouterQueryNoteToCalendar = { focus: date.value };
    router.push({ name: PAGE.CALENDAR, query });
  }
  loading.value = false;
};
const upsertPlannedRecord = async () => {
  if (!validateRecordAndShowErrorMsg()) return;

  const payload = {
    id: id.value,
    dayClassificationId: selectedDayId.value ?? DUMMY.NM,
    isPay: isPay.value,
    methodId: selectedMethodId.value ?? DUMMY.NM,
    isInstead: isInstead.value,
    typeId: selectedTypeId.value ?? DUMMY.NM,
    subTypeId: selectedSubTypeId.value,
    price: price.value,
    memo: memo.value,
  };
  const apiRes = await supabaseUpsertPlannedRecord(
    {
      isDemoLogin: isDemoLogin.value,
      userUid: userUid.value ?? DUMMY.STR,
      isPair: isPair.value,
      pairId: pairId.value ?? DUMMY.NM,
    },
    payload
  );
  if (apiRes.error !== null) {
    alert(apiRes.message + `(Error: ${JSON.stringify(apiRes.error)})`);
    return;
  }

  setToast(id.value === null ? '登録しました' : '変更しました');
  router.push({ name: PAGE.SETTING });
};
const validateRecordAndShowErrorMsg = () => {
  // ボタンが非活性なので以下は起こらない想定
  if (!selectedMethodId.value || !selectedType.value) {
    return false;
  }
  if (
    !!receivedRecordDate.value &&
    !TimeUtility.IsSameYearMonth(receivedRecordDate.value, date.value)
  ) {
    setToast('定期的なものは同月中のみ変更可能です', 'error');
    return false;
  }
  return true;
};
const deleteRecord = async () => {
  if (id.value === null) throw new Error('deleteRecord');
  const apiRes = await supabaseDeleteRecord({ isDemoLogin: isDemoLogin.value }, { id: id.value });
  if (apiRes.error !== null) {
    alert(apiRes.message + `(Error: ${JSON.stringify(apiRes.error)})`);
    return;
  }
  setToast('削除しました');
  const query: RouterQueryNoteToCalendar = { focus: date.value };
  router.push({ name: PAGE.CALENDAR, query });
};
const deletePlannedRecord = async () => {
  const payload = { id: id.value ?? DUMMY.NM };
  const apiRes = await supabaseDeletePlannedRecord({ isDemoLogin: isDemoLogin.value }, payload);
  if (apiRes.error !== null) {
    // TODO 紐づく record が存在する時、全てを null に更新してからplanned_recordを削除する
    if (apiRes.error.code === '23503') {
      setToast('紐づくデータがあるので削除できません', 'error');
    } else {
      alert(apiRes.message + `(Error: ${JSON.stringify(apiRes.error)})`);
    }
    return;
  }

  setToast('削除しました');
  router.push({ name: PAGE.SETTING });
};

watch(isPair, (newValue, oldValue) => {
  if (isPlannedRecord.value && id.value != null) {
    // planned_record 編集時、isPair の切り替えをできなくする
    router.push({ name: PAGE.SETTING });
    setToast('共有の変更はできません', 'error');
    return;
  }
  selectedTypeId.value = null;
  selectedSubTypeId.value = null;
  selectedMethodId.value = null;
});

// created
(async () => {
  enableLoading();

  const apiResType = await getTypeList({
    isDemoLogin: isDemoLogin.value,
    userUid: userUid.value ?? DUMMY.STR,
  });
  if (apiResType.error != null) {
    alert(apiResType.message + `(Error: ${JSON.stringify(apiResType.error)})`);
    return;
  }
  const apiResMethod = await getMethodList({
    isDemoLogin: isDemoLogin.value,
    userUid: userUid.value ?? DUMMY.STR,
  });
  if (apiResMethod.error != null) {
    alert(apiResMethod.message + `(Error: ${JSON.stringify(apiResMethod.error)})`);
    return;
  }
  typeList.value = apiResType.data;
  methodList.value = apiResMethod.data;

  const routerQuery = route.query as RouterQueryCalendarToNote;
  if (routerQuery.routerParamKey === routerParamKey.PLANNED_RECORD) {
    const plannedRecord = routerParam<PlannedRecord>(routerParamKey.PLANNED_RECORD);
    if (plannedRecord !== null) await setPagePlannedRecord(plannedRecord, routerQuery.crud);
    else initSelectedMethodId();
  } else if (routerQuery.routerParamKey === routerParamKey.RECORD) {
    const record = routerParam<Record_>(routerParamKey.RECORD);
    if (record !== null) setPageRecord(record, routerQuery.crud);
    else initSelectedMethodId();
  } else {
    initSelectedMethodId();
  }

  isEndInit.value = true;
  disableLoading();
})();
</script>

<style scoped lang="scss">
:deep(.select-day-by) {
  width: 140px;
  .v-input__slot:before {
    border-width: 0 !important;
  }
}
.text-field-type {
  padding-top: 0;
  margin-top: 0;
}
// v-btnに可変の高さ：https://tech-blog.optim.co.jp/entry/2021/12/22/130000
.btn-subtype {
  height: auto !important;
  width: 100%;
  max-width: 100%;
  min-height: 42px;
  padding: 0 4px !important;
  display: block !important;
  white-space: normal !important;
  overflow-wrap: anywhere !important; // SafariEで非対応
  word-break: break-word; // Safari対応
}
:deep(.text-field-price input) {
  font-size: $fontsize-large;
  text-align: right;
}
:deep(.text-field-price .v-text-field__suffix) {
  opacity: 1;
  padding-left: 8px;
}
:deep(.text-field-price-padding .v-text-field__slot) {
  padding-right: 28px;
}
.col-btn {
  margin-right: 10px;
  flex-grow: 0;
}
// 手段のv-selectのmenuの表示
.v-menu__content {
  max-height: 80vh;
}
</style>
