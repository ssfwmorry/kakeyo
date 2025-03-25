<template>
  <v-container
    v-touch="{
      left: () => {
        moveNext();
      },
      right: () => {
        movePrev();
      },
    }"
    class="pa-1 h-100 bg-white"
  >
    <PaginationBar
      :title="calendarTitle"
      :subtitle="isEndInit ? '収支：' + monthSumStr + ' 円' : '　'"
      @prev="movePrev"
      @next="moveNext"
    ></PaginationBar>

    <v-row no-gutters class="mb-3">
      <FullCalendar :options="calendarOptions" ref="fullCalendar" class="w-100" />
    </v-row>

    <v-row no-gutters class="mb-2">
      <v-spacer />
      <v-col cols="3" class="pr-1">
        <v-btn
          variant="flat"
          block
          rounded
          color="primary"
          height="38"
          width="70"
          @click="isShowMemoInput = !isShowMemoInput"
          >TODO</v-btn
        >
      </v-col>
      <v-col cols="3" class="px-1">
        <v-btn
          variant="flat"
          block
          rounded
          color="primary"
          height="38"
          width="70"
          @click="goRecordCreatePage"
          >記録＋</v-btn
        >
      </v-col>
      <v-col cols="3" class="pl-1">
        <v-btn
          variant="flat"
          block
          rounded
          color="primary"
          height="38"
          width="70"
          @click="goPlanCreatePage"
          >予定＋</v-btn
        >
      </v-col>
    </v-row>

    <!-- TODOリスト表示 -->
    <v-row v-if="isShowMemoInput" no-gutters class="mb-2 px-2">
      <v-col cols="10" class="d-flex">
        <div v-if="isExistPair" class="px-3 d-flex align-center">
          <v-checkbox v-model="isPairMemo" density="compact" hide-details class="mt-0 pa-0">
            <template v-slot:label>
              <v-icon>{{ $ICONS.SHARE }}</v-icon>
            </template>
          </v-checkbox>
        </div>
        <v-text-field
          v-model="memoText"
          density="compact"
          variant="filled"
          hide-details
          :append-icon="$ICONS.PLUS"
          @click:append="addMemo()"
        ></v-text-field>
      </v-col>
      <v-col cols="2"></v-col>
    </v-row>

    <v-row no-gutters class="mb-2 pl-2">
      <v-col class="pl-2">
        <v-chip
          v-for="memo in memoList"
          :key="memo.id"
          closable
          label
          class="mr-2 mb-1"
          @click:close="deleteMemo(memo.id)"
          ><v-icon small v-if="!!memo.pair_id" class="mr-1">{{ $ICONS.SHARE }}</v-icon>
          {{ memo.memo }}
        </v-chip>
      </v-col>
    </v-row>

    <v-row no-gutters class="mb-2">
      <v-col class="pl-2">
        <h4>{{ selectedDayForShow }}</h4>
      </v-col>
    </v-row>

    <!-- plan 表示 -->
    <v-row v-if="selectedPlan" no-gutters class="px-2">
      <v-col>
        <v-card variant="outlined" class="pa-2 card-border">
          <v-row no-gutters class="mb-1">
            <v-col cols="9">
              <v-card-title class="py-0 px-1 fs-nml">
                {{ selectedPlan.title }}
              </v-card-title>
            </v-col>
            <v-col cols="3" class="py-0 pl-1 d-flex align-center">
              <v-btn
                variant="flat"
                :class="`bg-${selectedPlan.backgroundColor}`"
                class="mr-3 pa-0 btn-icon size-28 text-white"
              >
                <v-icon>{{ selectedPlan.isPair ? $ICONS.SHARE : '' }}</v-icon>
              </v-btn>
              {{ selectedPlan.typeName }}
            </v-col>
          </v-row>
          <v-divider class="mb-1" />
          <v-row no-gutters>
            <v-col cols="10" class="d-flex align-center">
              <pre
                v-if="selectedPlan.memo"
                v-html="StringUtility.autoLink(selectedPlan.memo)"
                class="py-1 pl-4 text-pre-wrap fs-sm"
              ></pre>
            </v-col>
            <v-col cols="2" class="d-flex justify-center align-center">
              <div class="px-2 py-0">
                <v-btn :icon="$ICONS.PENCIL" variant="flat" @click="goPlanEditPage()"></v-btn>
              </div>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>

    <!-- record 表示 -->
    <v-row v-if="selectedDayRecords" no-gutters>
      <v-col>
        <v-row v-for="record in selectedDayRecords" :key="record.id" no-gutters class="mb-1">
          <v-col>
            <RecordCard
              :isDisable="showRecordMode === 'BOTH' && !record.isSelf"
              :isPairType="record.isPair ?? false"
              :typeColor="record.typeColorClassificationName"
              :typeAndSubtype="StringUtility.typeAndSubtype(record.typeName, record.subTypeName)"
              :isShowPlannedIcon="!!record.plannedRecordId"
              :isEnableEdit="
                (record.isSelf ?? false) || ((record.isPair ?? false) && !record.isInstead)
              "
              :isPairMethod="(record.isPair ?? false) && !(record.isInstead ?? false)"
              :userName="record.pairUserName ?? ''"
              :methodColor="record.methodColorClassificationName"
              :methodName="record.methodName"
              :memo="record.memo ?? ''"
              :isShowBlueColorPrice="!record.isPay"
              :price="StringUtility.ConvertIntToShowStrWithIsPay(record.price, record.isPay)"
              @edit="goRecordEditPage(record)"
            ></RecordCard>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import type { GetRecordListItem } from '@/api/supabase/record.interface';
import { DUMMY, PAGE } from '@/utils/constants';
import StringUtility, { format } from '@/utils/string';
import TimeUtility from '@/utils/time';
import {
  crud,
  eventType,
  routerParamKey,
  type DateString,
  type EventGetPlan,
  type EventSet,
  type ExternalEvent,
  type Id,
  type Plan,
  type Record_,
  type RouterQueryCalendarToNote,
  type RouterQueryCalendarToPlan,
  type RouterQueryNoteToCalendar,
  type RouterQueryPlanToCalendar,
  type ShareType,
} from '@/utils/types/common';
// https://fullcalendar.io/docs
import type { CalendarOptions, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { type DateClickArg } from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/vue3';
import dayjs from 'dayjs';
import { decamelizeKeys } from 'humps';

type DateRecordList = Record<
  ShareType,
  {
    sum: number;
    records: GetRecordListItem[];
  }
> & { isHoliday: boolean; holidayStr: string | null };
type CalendarList = Record<DateString, DateRecordList>;

const { enableLoading, disableLoading } = useLoadingStore();
const [loginStore, pairStore, userStore] = [useLoginStore(), usePairStore(), useUserStore()];
const { isDemoLogin } = storeToRefs(loginStore);
const { isExistPair, isPair, pairId } = storeToRefs(pairStore);
const { userUid } = storeToRefs(userStore);
const { setIsPair } = usePairStore();
const { $ICONS } = useNuxtApp();
const { setRouterParam } = useRouterParamStore();
const route = useRoute();
const router = useRouter();
const {
  deleteMemo: supabaseDeleteMemo,
  getMemoList: supabaseGetMemoList,
  getMonthSum,
  getPlanList,
  getRecordList,
  insertMemo: supabaseInsertMemo,
  postRecords,
} = useSupabase();
const { setToast } = useToastStore();

const focus = ref<DateString | null>(null);
const fullCalendar = ref<InstanceType<typeof FullCalendar> | undefined>();

const handleShowRecords = (dateStr: DateString) => {
  showDayRecords(dateStr);
};

const handleShowPlan = (arg: EventClickArg) => {
  const external = arg.event.extendedProps as ExternalEvent;
  if (external.type === eventType.RECORD || external.type === eventType.HOLIDAY) {
    handleShowRecords(external.startStr);
  } else {
    const plan: EventGetPlan = {
      title: arg.event.title,
      start: arg.event.start ?? new Date(),
      end: arg.event.end,
      allDay: true,
      textColor: arg.event.textColor,
      borderColor: arg.event.borderColor,
      backgroundColor: arg.event.backgroundColor,
      classNames: [],
      startStr: external.startStr,
      endStr: external.endStr,
      dbEnd: external.dbEnd,
      type: external.type,
      planId: external.planId,
      isPair: external.isPair,
      memo: external.memo,
      typeId: external.typeId,
      typeName: external.typeName,
    };

    showPlan(plan);
  }
};

const calendarOptions = ref<CalendarOptions>({
  plugins: [dayGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  contentHeight: 'auto',
  fixedWeekCount: false,
  selectable: false, // eventを選択すると背景色が白になるのでtrueにする場合には要調整
  eventOrder: '-type,start,-duration,allDay,title',
  events: [],
  dateClick: (arg: DateClickArg) => {
    handleShowRecords(arg.dateStr);
  },
  eventClick: handleShowPlan,
});
const daySumList = ref<CalendarList>({});
const memoList = ref<
  {
    id: number;
    memo: string;
    pair_id: number | null;
  }[]
>([]);
const selectedDayForShow = ref<string | null>(null);
const selectedDate = ref<DateString | null>(null);
const selectedDayRecords = ref<GetRecordListItem[]>([]);
const selectedPlan = ref<EventGetPlan | null>(null);
const monthSum = ref({ ['SELF']: 0, ['PAIR']: 0, ['BOTH']: 0 });
const showRecordMode = ref<ShareType>('BOTH');
const isShowMemoInput = ref(false);
const isPairMemo = ref(false);
const memoText = ref<string | null>(null);
const isEndInit = ref(false);

const calendarTitle = computed(() =>
  focus.value === null ? '' : TimeUtility.ConvertDateStrToJPYearMonth(focus.value)
);
const monthSumStr = computed(() =>
  StringUtility.ConvertIntToShowPrefixStr(monthSum.value[showRecordMode.value])
);

const movePrev = async () => {
  if (focus.value === null) throw new Error('movePrev');
  const focusObj = TimeUtility.ConvertDateStrToYearMonthObj(focus.value);
  const prevObj = TimeUtility.PrevMonthInYearMonthObj(focusObj);
  const prev = prevObj.year + '-' + prevObj.month + '-01';
  focus.value = prev;
  await updateRange();
};
const moveNext = async () => {
  if (focus.value === null) throw new Error('moveNext');
  const focusObj = TimeUtility.ConvertDateStrToYearMonthObj(focus.value);
  const nextObj = TimeUtility.NextMonthInYearMonthObj(focusObj);
  const next = nextObj.year + '-' + nextObj.month + '-01';
  focus.value = next;
  await updateRange();
};
const setPageFocus = ({
  focus: argFocus,
}: RouterQueryNoteToCalendar | RouterQueryPlanToCalendar | { focus: undefined }) => {
  if (argFocus) focus.value = argFocus;
  else focus.value = TimeUtility.GetNowDate(isDemoLogin.value);
};
const updateRange = async () => {
  if (focus.value === null || fullCalendar.value === undefined) throw new Error('updateRange');
  enableLoading();
  const events: EventSet[] = [];

  fullCalendar.value.getApi().gotoDate(focus.value);
  const payload1 = {
    yearMonth: TimeUtility.ConvertDateStrToYearMonth(focus.value) ?? DUMMY.YM_STR,
  };
  const focusObj = TimeUtility.ConvertDateStrToYearMonthObj(focus.value);
  const prev = TimeUtility.PrevMonthInYearMonthObj(focusObj);
  const next = TimeUtility.NextMonthInYearMonthObj(focusObj);
  const payload2 = {
    start: prev.year + '-' + prev.month + '-21' + ' 00:00:00', // 全月の21日
    end: next.year + '-' + next.month + '-09' + ' 23:59:59', // 翌月の9日
  };
  const authParam = { isDemoLogin: isDemoLogin.value, userUid: userUid.value ?? DUMMY.STR };

  // plannedRecord から、足りない record を登録
  const apiResPostRecords = await postRecords(authParam, payload1);
  if (apiResPostRecords.error !== null) {
    alert(apiResPostRecords.message + `(Error: ${JSON.stringify(apiResPostRecords.error)})`);
    return;
  }

  // 月の収支を取得
  const apiResMonthSum = await getMonthSum(authParam, payload1);
  if (apiResMonthSum.error !== null) {
    alert(apiResMonthSum.message + `(Error: ${JSON.stringify(apiResMonthSum.error)})`);
    return;
  }

  // record を追加
  const apiResGetRecords = await getRecordList(authParam, payload2);
  if (apiResGetRecords.error !== null) {
    alert(apiResGetRecords.message + `(Error: ${JSON.stringify(apiResGetRecords.error)})`);
    return;
  }
  const tmpDaySumList = getDaySumList(apiResGetRecords.data);
  updatePaddingRecords(tmpDaySumList); // 毎日の record 用 event を定義

  // plan を追加
  const apiResPlans = await getPlanList(authParam, payload2);
  if (apiResPlans.error !== null || apiResPlans.data === null) {
    alert(apiResPlans.message + `(Error: ${JSON.stringify(apiResPlans.error)})`);
    return;
  }

  // plan 分を events に追加
  apiResPlans.data.forEach((plan: Plan) => {
    events.push({
      title: plan.name,
      start: dayjs(plan.start_date).toDate(),
      // events に追加するときに end に1日加算する。画面描画以外のデータ連携は dbEnd をつかう
      end: dayjs(plan.end_date).add(1, 'd').toDate(),
      allDay: true,
      borderColor: 'black',
      textColor: 'white',
      backgroundColor: plan.plan_type_color_classification_name,
      classNames: [`bg-${plan.plan_type_color_classification_name}`],
      type: eventType.PLAN,
      planId: plan.id,
      startStr: plan.start_date,
      endStr: plan.end_date,
      dbEnd: dayjs(plan.end_date).toDate(),
      isPair: plan.is_pair,
      memo: plan.memo,
      typeId: plan.plan_type_id,
      typeName: plan.plan_type_name,
    });
  });
  // recordと祝日 分を events に追加
  Object.keys(tmpDaySumList).forEach((dateStr) => {
    if (tmpDaySumList[dateStr].isHoliday) {
      events.push({
        title: '',
        start: dayjs(dateStr).toDate(),
        end: dayjs(dateStr).toDate(),
        allDay: true,
        borderColor: 'black',
        textColor: 'black',
        display: 'background',
        backgroundColor: 'rgba(255,255,255,0)',
        type: eventType.HOLIDAY,
        classNames: ['is-holiday'],
        startStr: dateStr,
      });
    }
    events.push({
      title: daySum(tmpDaySumList, dateStr, showRecordMode.value),
      start: dayjs(dateStr).toDate(),
      end: dayjs(dateStr).toDate(),
      allDay: true,
      borderColor: 'black',
      textColor: 'black',
      backgroundColor: 'rgba(255,255,255,0)',
      type: eventType.RECORD,
      classNames: ['fs-sm', 'ma-0', 'text-center'],
      startStr: dateStr,
    });
  });

  // レンダリングされるタイミングを揃えるため、全て取得してから、data を更新する
  daySumList.value = tmpDaySumList;
  monthSum.value = apiResMonthSum.data;
  calendarOptions.value.events = events;
  isEndInit.value = true; // fullCalendar 描画に必要な data 更新後に isEndInit を TRUE にして、 updateRange() を呼ぶ
  disableLoading();
};

const daySum = (calendarList: CalendarList, date: DateString, mode: ShareType) => {
  const sum = calendarList[date][mode].sum;
  if (sum !== null && calendarList[date][mode].records.length > 0) {
    return StringUtility.ConvertIntToShowStr(sum);
  } else {
    return '　'; // なんらかの文字列を表示させる必要がある、recordがない場合にeventの描画がずれるため
  }
};

const getDaySumList = (recordList: GetRecordListItem[]): CalendarList => {
  let daySums: CalendarList = {};
  recordList.forEach((record) => {
    const dateStr = TimeUtility.ConvertDBResponseDatetimeToDateStr(record.datetime);
    const recordPrice = record.price === 0 || record.isPay ? record.price : record.price * -1;
    if (!(dateStr in daySums)) {
      daySums[dateStr] = {
        ['SELF']: { sum: 0, records: [] },
        ['PAIR']: { sum: 0, records: [] },
        ['BOTH']: { sum: 0, records: [] },
        isHoliday: false,
        holidayStr: null,
      };
    }
    // SELF
    if (!record.isPair && record.isSelf) {
      daySums[dateStr]['SELF'].records.push(record);
      daySums[dateStr]['SELF'] = {
        sum: daySums[dateStr]['SELF'].sum + recordPrice,
        records: daySums[dateStr]['SELF'].records,
      };
    }
    // PAIR
    if (record.isPair) {
      daySums[dateStr]['PAIR'].records.push(record);
      daySums[dateStr]['PAIR'] = {
        sum: daySums[dateStr]['PAIR'].sum + recordPrice,
        records: daySums[dateStr]['PAIR'].records,
      };
    }
    // BOTH
    daySums[dateStr]['BOTH'].records.push(record);
    daySums[dateStr]['BOTH'] = {
      sum: daySums[dateStr]['BOTH'].sum + (record.isSelf ? recordPrice : 0),
      records: daySums[dateStr]['BOTH'].records,
    };
  });
  return daySums;
};

const updatePaddingRecords = (calendarList: CalendarList) => {
  if (focus.value === null) throw new Error('updatePaddingRecords');

  const focusObj = TimeUtility.ConvertDateStrToYearMonthObj(focus.value);
  const prev = TimeUtility.PrevMonthInYearMonthObj(focusObj);
  const start = prev.year + '-' + prev.month + '-21'; // 全月の21日
  // 50 回やっていればかならず翌月に到達する
  for (let i = 0; i < 50; i++) {
    const date = dayjs(start).add(i, 'd');
    const dateStr = date.format(format.Date);
    if (!(dateStr in calendarList)) {
      const empty = { sum: 0, records: [] };
      calendarList[dateStr] = {
        SELF: empty,
        PAIR: empty,
        BOTH: empty,
        isHoliday: false,
        holidayStr: null,
      };
    }
    const holidayStr = TimeUtility.GetHolidayName(dateStr);

    if (!!holidayStr) {
      calendarList[dateStr].isHoliday = true;
      calendarList[dateStr].holidayStr = holidayStr;
    }
  }
};
const showDayRecords = (dateStr: DateString) => {
  selectedPlan.value = null;

  if (daySumList.value[dateStr].isHoliday) {
    selectedDayForShow.value =
      TimeUtility.ConvertDateStrToJPDate(dateStr) + ` ( ${daySumList.value[dateStr].holidayStr} )`;
  } else {
    selectedDayForShow.value = TimeUtility.ConvertDateStrToJPDate(dateStr);
  }

  selectedDate.value = dateStr;

  selectedDayRecords.value = daySumList.value[dateStr][showRecordMode.value].records;
};
const showPlan = (plan: EventGetPlan) => {
  selectedDayRecords.value = [];
  selectedDayForShow.value = TimeUtility.ConvertDateObjsToJPPeriod(plan.start, plan.dbEnd);
  selectedDate.value = plan.startStr;
  selectedPlan.value = plan;
};
const goRecordCreatePage = () => {
  const tmpDate = selectedDate.value ?? TimeUtility.GetNowDate(isDemoLogin.value);
  const record: Record_ = {
    id: DUMMY.NM,
    datetime: TimeUtility.ConvertDateStrToDatetime(tmpDate),
    is_instead: null,
    is_pair: DUMMY.BL,
    is_pay: DUMMY.BL,
    is_self: null,
    memo: null,
    method_color_classification_name: DUMMY.STR,
    method_id: DUMMY.NM,
    method_name: DUMMY.STR,
    pair_user_name: null,
    planned_record_id: null,
    price: DUMMY.NM,
    sub_type_id: null,
    sub_type_name: null,
    type_color_classification_name: DUMMY.STR,
    type_id: DUMMY.NM,
    type_name: DUMMY.STR,
  };
  setRouterParam(routerParamKey.RECORD, record);
  const query: RouterQueryCalendarToNote = {
    routerParamKey: routerParamKey.RECORD,
    crud: crud.CREATE,
  };
  router.push({ name: PAGE.NOTE, query });
};
const goPlanCreatePage = () => {
  const tmpDate = selectedDate.value ?? TimeUtility.GetNowDate(isDemoLogin.value);
  const plan: Plan = {
    id: DUMMY.NM,
    start_date: tmpDate,
    end_date: tmpDate,
    name: DUMMY.STR,
    memo: null,
    is_pair: DUMMY.BL,
    plan_type_id: DUMMY.NM,
    plan_type_name: DUMMY.STR,
    plan_type_color_classification_name: DUMMY.STR,
  };
  const query: RouterQueryCalendarToPlan = {
    crud: crud.CREATE,
  };
  setRouterParam(routerParamKey.PLAN, plan);
  router.push({ name: PAGE.PLAN, query });
};
const goRecordEditPage = (record: GetRecordListItem) => {
  setIsPair(record.isPair);

  // TODO
  const tmpRecord: Record_ = {
    ...decamelizeKeys<GetRecordListItem>(record),
  };
  setRouterParam(routerParamKey.RECORD, tmpRecord);
  const query: RouterQueryCalendarToNote = {
    routerParamKey: routerParamKey.RECORD,
    crud: crud.UPDATE,
  };
  router.push({ name: PAGE.NOTE, query });
};
const goPlanEditPage = () => {
  if (selectedPlan.value === null) throw new Error('goPlanEditPage');
  setIsPair(selectedPlan.value.isPair);

  const plan: Plan = {
    id: selectedPlan.value.planId,
    start_date: selectedPlan.value.startStr,
    end_date: selectedPlan.value.endStr,
    name: selectedPlan.value.title,
    memo: selectedPlan.value.memo,
    is_pair: selectedPlan.value.isPair,
    plan_type_id: selectedPlan.value.typeId,
    plan_type_name: selectedPlan.value.typeName,
    plan_type_color_classification_name: selectedPlan.value.backgroundColor,
  };

  setRouterParam(routerParamKey.PLAN, plan);
  const query: RouterQueryCalendarToPlan = {
    crud: crud.UPDATE,
  };
  router.push({ name: PAGE.PLAN, query });
};
const getMemoList = async () => {
  const apiRes = await supabaseGetMemoList({
    isDemoLogin: isDemoLogin.value,
    userUid: userUid.value ?? DUMMY.STR,
    pairId: pairId.value,
  });
  if (apiRes.error !== null) {
    alert(apiRes.message + `(Error: ${JSON.stringify(apiRes.error)})`);
    return;
  }

  memoList.value = apiRes.data ?? [];
};
const addMemo = async () => {
  if (!memoText.value) {
    setToast('空です', 'error');
    return;
  }
  enableLoading();

  const payload = {
    memo: memoText.value,
    isPair: isPairMemo.value,
  };
  const apiRes = await supabaseInsertMemo(
    {
      isDemoLogin: isDemoLogin.value,
      userUid: userUid.value ?? DUMMY.STR,
      pairId: pairId.value ?? DUMMY.NM,
    },
    payload
  );
  if (apiRes.error !== null) {
    alert(apiRes.message + `(Error: ${JSON.stringify(apiRes.error)})`);
    return;
  }
  setToast('登録しました');
  await getMemoList();
  resetMemoInput();
  disableLoading();
};
const resetMemoInput = () => {
  isShowMemoInput.value = false;
  memoText.value = null;
};
const deleteMemo = async (id: Id | null) => {
  enableLoading();

  const payload = {
    id: id ?? DUMMY.NM,
  };
  const apiRes = await supabaseDeleteMemo({ isDemoLogin: isDemoLogin.value }, payload);

  if (apiRes.error !== null) {
    alert(apiRes.message + `(Error: ${JSON.stringify(apiRes.error)})`);
    return;
  }

  setToast('削除しました');
  await getMemoList();
  disableLoading();
};

// created
(async () => {})();

onMounted(async () => {
  await getMemoList();

  setPageFocus(route.query as RouterQueryNoteToCalendar | RouterQueryPlanToCalendar);

  // refはマウント後にしか参照できないので、plan更新はここでやる
  await updateRange();
});
</script>

<style lang="scss" scoped>
// ツールバー非表示
:deep(.fc-header-toolbar) {
  display: none;
}
// テーブルヘッダ
:deep(.fc-col-header) {
  font-size: 0.6rem !important;
}
:deep(.fc-col-header-cell-cushion) {
  padding: 1px 4px !important;
}
// セルの日付表示
:deep(.fc-daygrid-day-top) {
  height: 14px;
  font-size: 0.8rem !important;
  font-weight: 550 !important;
  justify-content: start;
  padding-left: 4px;
  .fc-daygrid-day-number {
    padding: 0;
  }
}
// セル祝日
:deep(.fc-daygrid-day:has(.is-holiday)) {
  color: $vuetify-red;
}
// テーブルヘッダ日曜日and土曜日
:deep(.fc-scrollgrid-section-header tr) {
  th:first-child a {
    color: $vuetify-red;
  }
  th:last-child a {
    color: $vuetify-blue;
  }
}
// セル日曜日and土曜日
:deep(.fc-daygrid-body tr) {
  td:first-child a {
    color: $vuetify-red;
  }
  td:last-child a {
    color: $vuetify-blue;
  }
}
// セル本日
:deep(.fc-day-today) {
  background-color: #ffff00 !important; // yellow-accent2;
}
// イベント
:deep(.fc-daygrid-day-events) {
  margin-bottom: 0.3rem !important;
  min-height: 0 !important;
}
:deep(.fc-h-event) {
  border: 0;
}
.col-plan-name {
  max-width: 150px !important;
}
:deep(.treeview-height) {
  height: 300px;
  .v-treeview-node__root {
    min-height: 25px;
  }
}
// price label
:deep(.event-price) {
  background-color: inherit !important;
  border: 0;
}
.size-28 {
  min-width: 28px;
  max-width: 28px;
  min-height: 28px;
  max-height: 28px;
}
</style>
