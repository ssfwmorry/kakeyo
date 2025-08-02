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
      mode="MONTH"
      :subtitle="isEndInit ? '収支：' + monthSumStr + ' 円' : '　'"
      :focus="focusObj"
      @prev="movePrev"
      @next="moveNext"
      @update="updateFocus"
    ></PaginationBar>

    <v-row no-gutters class="mb-3">
      <FullCalendar :options="calendarOptions" ref="fullCalendar" class="w-100" />
    </v-row>

    <v-row no-gutters class="mb-2">
      <v-col class="d-flex align-center px-1">
        <v-btn
          variant="text"
          height="38"
          :icon="$ICONS.CHEVRON_DOWN"
          @click="showAllRecords"
        ></v-btn>
      </v-col>
      <v-col cols="3" class="px-1">
        <v-btn
          variant="flat"
          block
          rounded
          color="primary"
          height="38"
          @click="isShowMemoInput = !isShowMemoInput"
          >TODO</v-btn
        >
      </v-col>
      <v-col :cols="isExistsShortCut ? 4 : 3" class="px-1 d-flex">
        <v-sheet rounded height="38" color="primary" class="d-flex flex-row rounded-pill w-100">
          <v-row no-gutters>
            <v-col :cols="isExistsShortCut ? 8 : 12">
              <v-btn
                variant="flat"
                rounded
                color="primary"
                height="38"
                class="px-0 w-100"
                @click="goRecordCreatePage"
                >記録＋</v-btn
              >
            </v-col>
            <v-col cols="4">
              <v-btn
                v-if="isExistsShortCut"
                variant="flat"
                rounded
                color="blue"
                height="38"
                min-width="38"
                class="px-0 w-100"
                @click="isShowShortCut = !isShowShortCut"
                ><v-icon>{{ $ICONS.ARROW_RIGHT_TOP }}</v-icon></v-btn
              >
            </v-col>
          </v-row>
        </v-sheet>
      </v-col>
      <v-col cols="3" class="pl-1">
        <v-btn variant="flat" block rounded color="primary" height="38" @click="goPlanCreatePage"
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

    <!-- ショートカットリスト表示 -->
    <v-row v-if="isShowShortCut" no-gutters class="mb-3 px-2">
      <v-col v-for="(shortCut, index) in shortCutList" :key="index" cols="6">
        <RecordCardHalf
          :datetime="null"
          :labelColor="null"
          :backgroundColor="null"
          :typeColor="shortCut.types.colorClassifications.name"
          :typeAndSubtype="
            StringUtility.typeAndSubtype(shortCut.types.name, shortCut.subTypes?.name ?? null)
          "
          :isShowPlannedIcon="false"
          :isSettled="false"
          :memo="shortCut.memo ?? ''"
          :isShowBlueColorPrice="!shortCut.isPay"
          :price="StringUtility.ConvertIntToShowStrWithIsPay(shortCut.price, shortCut.isPay)"
          @click.native="insertRecordFromShortCut(shortCut)"
          class="w-100 mb-1"
          :class="index % 2 === 0 ? 'mr-1' : 'ml-1'"
        ></RecordCardHalf>
      </v-col>
    </v-row>

    <!-- メモ表示 -->
    <v-row no-gutters class="mb-2 pl-2">
      <v-col class="pl-2">
        <v-chip
          v-for="memo in memoList"
          :key="memo.id"
          closable
          label
          class="mr-2 mb-1"
          @click:close="deleteMemo(memo.id)"
          ><v-icon small v-if="!!memo.pairId" class="mr-1">{{ $ICONS.SHARE }}</v-icon>
          {{ memo.memo }}
        </v-chip>
      </v-col>
    </v-row>

    <!-- 祝日名表示 -->
    <v-row no-gutters class="mb-2">
      <v-col class="pl-2">
        <h4>{{ selectedHoliday }}</h4>
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

    <!-- records 表示 -->
    <div v-for="dateRecord in selectedDateRecords" :key="dateRecord.dateLabel" class="mb-3">
      <v-row no-gutters class="mb-2">
        <v-col class="pl-2">
          <h4>{{ dateRecord.dateLabel }}</h4>
        </v-col>
      </v-row>
      <v-row v-for="record in dateRecord.records" :key="record.id" no-gutters class="mb-1">
        <v-col>
          <RecordCard
            :isDisable="!record.isSelf"
            :isPairType="record.isPair"
            :typeColor="record.typeColorClassificationName ?? SettlementRecord.color"
            :typeAndSubtype="StringUtility.typeAndSubtype(record.typeName, record.subTypeName)"
            :isShowPlannedIcon="!!record.plannedRecordId"
            :isEnableEdit="
              record.isSettlement !== true &&
              ((record.isSelf ?? false) || ((record.isPair ?? false) && !record.isInstead))
            "
            :isPairMethod="(record.isPair ?? false) && !(record.isInstead ?? false)"
            :userName="record.pairUserName ?? ''"
            :methodColor="record.methodColorClassificationName"
            :methodName="record.methodName"
            :memo="record.memo ?? ''"
            :isShowBlueColorPrice="
              !record.isPay || (record.isSettlement === true && !record.isSelf)
            "
            :isSettlement="record.isSettlement ?? false"
            :price="
              StringUtility.ConvertIntToShowStrWithIsPay(
                record.price,
                record.isSettlement === true || record.isPay === null ? record.isSelf : record.isPay
              )
            "
            @edit="goRecordEditPage(record)"
          ></RecordCard>
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import type { GetMemoListOutput } from '@/api/supabase/memo.interface';
import type { GetRecordListItem } from '@/api/supabase/record.interface';
import type { GetShortCutListItem } from '@/api/supabase/shortCut.interface';
import { PAGE, SettlementRecord } from '@/utils/constants';
import StringUtility, { format } from '@/utils/string';
import TimeUtility from '@/utils/time';
import type { DateString, Id, YearMonthNumObj } from '@/utils/types/common';
import {
  RouterParamKey,
  type PageQueryParameter,
  type Plan,
  type Record_,
  type RouterQueryNoteToCalendar,
  type RouterQueryPlanToCalendar,
} from '@/utils/types/page';
import type { CalendarOptions, EventClickArg, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { type DateClickArg } from '@fullcalendar/interaction';
// https://fullcalendar.io/docs
import FullCalendar from '@fullcalendar/vue3';
import dayjs from 'dayjs';

const eventType = {
  PLAN: 'PLAN',
  RECORD: 'RECORD',
  HOLIDAY: 'HOLIDAY',
} as const;

type DateRecordList = {
  //  record のデータ
  sum: number;
  records: GetRecordListItem[];
  // 日付のデータ
  isHoliday: boolean;
  holidayStr: string | null;
  dateLabel: string;
  dateStr: DateString;
  isInMonth: boolean; // その月のデータかどうか
};
type CalendarList = Record<DateString, DateRecordList>;
type ExternalEventPlan = {
  type: 'PLAN';
  startStr: DateString;
  endStr: DateString;
  dbEnd: Date | null; // DBに登録されている終了日。このときBaseEventGetEndは次の日を示す
  memo: string | null;
  planId: number; // id はライブラリの定義に string として既存
  isPair: boolean;
  typeId: Id;
  typeName: string;
};
type ExternalEventRecord = {
  type: 'RECORD';
  startStr: DateString;
};
type ExternalEventHoliday = {
  type: 'HOLIDAY';
  startStr: DateString;
  // https://fullcalendar.io/docs/eventDisplay
  display: 'background';
};
type ExternalEvent = ExternalEventPlan | ExternalEventRecord | ExternalEventHoliday;
// 内部変数として持っておくための型
type BaseEventGet = {
  title: string;
  start: Date;
  end: Date | null;
  allDay: true;
  textColor: string;
  borderColor: string;
  backgroundColor: string;
  classNames: Array<string>;
};
type EventGetPlan = BaseEventGet & ExternalEventPlan;

// ライブラリに登録する用の型
type EventInputExpanded = EventInput & {
  title: string;
  start: Date;
  end: Date;
  allDay: true;
  textColor: string;
  borderColor: string;
  backgroundColor: string;
  classNames: Array<string>;
} & ExternalEvent;
const { enableLoading, disableLoading } = useLoadingStore();
const [authStore, pairStore] = [useAuthStore(), usePairStore()];
const { isDemoLogin, isExistPair, pairId, userUid } = storeToRefs(authStore);
const { isPair } = storeToRefs(pairStore);
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
  getShortCutList,
  insertMemo: supabaseInsertMemo,
  upsertRecord,
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
  // locale: 'ja',
  selectable: false, // eventを選択すると背景色が白になるのでtrueにする場合には要調整
  eventOrder: '-type,start,-duration,allDay,title',
  events: [],
  dateClick: (arg: DateClickArg) => {
    handleShowRecords(arg.dateStr);
  },
  eventClick: handleShowPlan,
});
const daySumList = ref<CalendarList>({});
const memoList = ref<GetMemoListOutput['data']>([]);
const shortCutList = ref<GetShortCutListItem[]>([]);
const selectedHoliday = ref<string | null>(null);
const selectedDateRecords = ref<DateRecordList[]>([]);
const selectedDate = ref<DateString | null>(null);
const selectedPlan = ref<EventGetPlan | null>(null);
const monthSumStr = ref('');
const isShowMemoInput = ref(false);
const isExistsShortCut = ref(false);
const isShowShortCut = ref(false);
const isPairMemo = ref(false);
const memoText = ref<string | null>(null);
const isEndInit = ref(false);

const focusObj = computed(() => {
  if (focus.value === null) return null;
  return TimeUtility.ConvertDateStrToYearMonthNumObj(focus.value);
});

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
const updateFocus = async (obj: YearMonthNumObj) => {
  const strObj = TimeUtility.ConvertYearMonthNumObjToYearMonthObj(obj);
  focus.value = `${strObj.year}-${strObj.month}-01`;
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
  const events: EventInputExpanded[] = [];

  fullCalendar.value.getApi().gotoDate(focus.value);
  const payload1 = {
    yearMonth: TimeUtility.ConvertDateStrToYearMonth(focus.value),
  };
  const focusObj = TimeUtility.ConvertDateStrToYearMonthObj(focus.value);
  const prev = TimeUtility.PrevMonthInYearMonthObj(focusObj);
  const next = TimeUtility.NextMonthInYearMonthObj(focusObj);
  const payload2 = {
    start: prev.year + '-' + prev.month + '-21' + ' 00:00:00', // 全月の21日
    end: next.year + '-' + next.month + '-09' + ' 23:59:59', // 翌月の9日
  };
  const authParam = { isDemoLogin: isDemoLogin.value, userUid: userUid.value };

  // plannedRecord から、足りない record を登録(表示日付が、現在日付の6ヶ月後以前の場合, バッファで+1ヶ月)
  if (dayjs(focus.value).isBefore(dayjs().add(7, 'M'))) {
    const apiResPostRecords = await postRecords(authParam, payload1);
    assertApiResponse(apiResPostRecords);
  }

  const [apiResMonthSum, apiResGetRecords, apiResPlans, apiResShortCuts] = await Promise.all([
    getMonthSum(authParam, payload1), // 月の収支を取得
    getRecordList(authParam, payload2), // record を取得
    getPlanList(authParam, payload2), // plan を追加
    getShortCutList(authParam), // ショートカットリストを取得
  ]);
  assertApiResponse(apiResMonthSum);
  assertApiResponse(apiResGetRecords);
  assertApiResponse(apiResPlans);
  assertApiResponse(apiResShortCuts);

  const tmpDaySumList = getDaySumList(apiResGetRecords.data);
  updatePaddingRecords(tmpDaySumList); // 毎日の record 用 event を定義

  // plan 分を events に追加
  apiResPlans.data.forEach((plan) => {
    events.push({
      title: plan.name,
      start: dayjs(plan.startDate).toDate(),
      // events に追加するときに end に1日加算する。画面描画以外のデータ連携は dbEnd をつかう
      end: dayjs(plan.endDate).add(1, 'd').toDate(),
      allDay: true,
      borderColor: 'black',
      textColor: 'white',
      backgroundColor: plan.planTypeColorClassificationName,
      classNames: [`bg-${plan.planTypeColorClassificationName}`],
      type: eventType.PLAN,
      planId: plan.id,
      startStr: plan.startDate,
      endStr: plan.endDate,
      dbEnd: dayjs(plan.endDate).toDate(),
      isPair: plan.isPair,
      memo: plan.memo,
      typeId: plan.planTypeId,
      typeName: plan.planTypeName,
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
      title: daySum(tmpDaySumList, dateStr),
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
  monthSumStr.value = StringUtility.ConvertIntToShowPrefixStr(apiResMonthSum.data);
  isExistsShortCut.value = apiResShortCuts.data.length > 0;
  shortCutList.value = apiResShortCuts.data;
  calendarOptions.value.events = events;
  isEndInit.value = true; // fullCalendar 描画に必要な data 更新後に isEndInit を TRUE にして、 updateRange() を呼ぶ
  disableLoading();
};

const daySum = (calendarList: CalendarList, date: DateString) => {
  const sum = calendarList[date].sum;
  if (sum !== null && calendarList[date].records.length > 0) {
    return StringUtility.ConvertIntToShowStr(sum);
  } else {
    return '　'; // なんらかの文字列を表示させる必要がある、recordがない場合にeventの描画がずれるため
  }
};

const getDaySumList = (recordList: GetRecordListItem[]): CalendarList => {
  let daySums: CalendarList = {};
  recordList.forEach((record) => {
    const dateStr = TimeUtility.ConvertDBResponseDatetimeToDateStr(record.datetime);
    const tmpIsPay = record.isSettlement === true ? record.isSelf : record.isPay;
    const recordPrice = record.price === 0 || tmpIsPay ? record.price : record.price * -1;
    if (!(dateStr in daySums)) {
      daySums[dateStr] = {
        sum: 0,
        records: [],
        isHoliday: false,
        holidayStr: null,
        dateLabel: TimeUtility.ConvertDateStrToJPDate(dateStr),
        dateStr,
        isInMonth: dayjs(dateStr).isSame(focus.value, 'month'),
      };
    }
    daySums[dateStr].records.push(record);
    daySums[dateStr] = {
      ...daySums[dateStr],
      sum: daySums[dateStr].sum + (record.isSelf || record.isSettlement === true ? recordPrice : 0),
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
      calendarList[dateStr] = {
        sum: 0,
        records: [],
        isHoliday: false,
        holidayStr: null,
        dateLabel: TimeUtility.ConvertDateStrToJPDate(dateStr),
        dateStr,
        isInMonth: dayjs(dateStr).isSame(focus.value, 'month'),
      };
    }
    const holidayStr = TimeUtility.GetHolidayName(dateStr);

    if (!!holidayStr) {
      calendarList[dateStr].isHoliday = true;
      calendarList[dateStr].holidayStr = holidayStr;
      calendarList[dateStr].dateLabel =
        TimeUtility.ConvertDateStrToJPDate(dateStr) + ` ( ${calendarList[dateStr].holidayStr} )`;
    }
  }
};
const showDayRecords = (dateStr: DateString) => {
  selectedPlan.value = null;
  // 日付選択した時にrecordsがないときに祝日ラベルを表示させるための処理
  if (daySumList.value[dateStr].records.length === 0) {
    if (daySumList.value[dateStr].isHoliday) {
      selectedHoliday.value = daySumList.value[dateStr].dateLabel;
    } else {
      selectedHoliday.value = null;
    }
  }

  selectedDate.value = dateStr;
  selectedDateRecords.value = [daySumList.value[dateStr]];
};
const showAllRecords = () => {
  selectedPlan.value = null;
  selectedHoliday.value = null;
  const sortedAndFilteredList = Object.values(daySumList.value)
    .sort((a, b) => {
      return a.dateStr < b.dateStr ? 1 : -1; // 降順
    })
    .filter((item) => item.isInMonth && item.records.length > 0);
  selectedDateRecords.value = sortedAndFilteredList;
};
const showPlan = (plan: EventGetPlan) => {
  selectedDate.value = plan.startStr;
  selectedDateRecords.value = [];
  selectedPlan.value = plan;
};
const goRecordCreatePage = () => {
  const tmpDate = selectedDate.value ?? TimeUtility.GetNowDate(isDemoLogin.value);
  const record: Record_ = {
    id: null,
    datetime: TimeUtility.ConvertDateStrToDatetime(tmpDate),
  };
  setRouterParam(RouterParamKey.RECORD, record);
  const query: PageQueryParameter = { key: RouterParamKey.RECORD };
  router.push({ name: PAGE.NOTE, query });
};
const goPlanCreatePage = () => {
  const tmpDate = selectedDate.value ?? TimeUtility.GetNowDate(isDemoLogin.value);
  const plan: Plan = {
    id: null,
    startDate: tmpDate,
    endDate: tmpDate,
    isPair: isPair.value,
  };
  setRouterParam(RouterParamKey.PLAN, plan);
  router.push({ name: PAGE.PLAN });
};
const goRecordEditPage = (record: GetRecordListItem) => {
  if (record.isPay === null) {
    alert('予期せぬ状況');
    return;
  }
  setIsPair(record.isPair);

  setRouterParam(RouterParamKey.RECORD, { ...record, isPay: record.isPay });
  const query: PageQueryParameter = { key: RouterParamKey.RECORD };
  router.push({ name: PAGE.NOTE, query });
};
const goPlanEditPage = () => {
  if (selectedPlan.value === null) throw new Error('goPlanEditPage');
  setIsPair(selectedPlan.value.isPair);

  const plan: Plan = {
    id: selectedPlan.value.planId,
    startDate: selectedPlan.value.startStr,
    endDate: selectedPlan.value.endStr,
    name: selectedPlan.value.title,
    memo: selectedPlan.value.memo,
    isPair: selectedPlan.value.isPair,
    planTypeId: selectedPlan.value.typeId,
    planTypeName: selectedPlan.value.typeName,
    planTypeColorClassificationName: selectedPlan.value.backgroundColor,
  };

  setRouterParam(RouterParamKey.PLAN, plan);
  router.push({ name: PAGE.PLAN });
};
const getMemoList = async () => {
  const apiRes = await supabaseGetMemoList({
    userUid: userUid.value,
    pairId: pairId.value,
  });
  assertApiResponse(apiRes);

  memoList.value = apiRes.data;
};
const addMemo = async () => {
  if (!memoText.value) {
    setToast('空です', 'error');
    return;
  }
  enableLoading();
  if (isPairMemo.value === true && pairId.value === null) {
    alert('予期せぬ状態: addMemo');
    return;
  }
  const payload = {
    memo: memoText.value,
    isPair: isPairMemo.value,
  };
  const apiRes = await supabaseInsertMemo(
    {
      isDemoLogin: isDemoLogin.value,
      userUid: userUid.value,
      pairId: pairId.value,
    },
    payload
  );
  assertApiResponse(apiRes);

  setToast('登録しました');
  await getMemoList();
  resetMemoInput();
  disableLoading();
};
const resetMemoInput = () => {
  isShowMemoInput.value = false;
  memoText.value = null;
};
const deleteMemo = async (id: Id) => {
  enableLoading();
  const apiRes = await supabaseDeleteMemo({ isDemoLogin: isDemoLogin.value }, { id });
  assertApiResponse(apiRes);

  setToast('削除しました');
  await getMemoList();
  disableLoading();
};

const insertRecordFromShortCut = async (shortCut: GetShortCutListItem) => {
  enableLoading();
  const now = TimeUtility.GetNowDate(isDemoLogin.value);

  const payload = {
    id: null,
    datetime: TimeUtility.ConvertDateStrToDatetime(now),
    isPay: shortCut.isPay,
    methodId: shortCut.methodId,
    isInstead: null,
    typeId: shortCut.typeId,
    subTypeId: shortCut.subTypeId,
    price: shortCut.price,
    memo: shortCut.memo,
  };
  const apiRes = await upsertRecord(
    {
      isDemoLogin: isDemoLogin.value,
      userUid: userUid.value,
      isPair: shortCut.pairId !== null,
      pairId: shortCut.pairId,
    },
    payload
  );
  assertApiResponse(apiRes);

  isShowShortCut.value = false;

  await updateRange();
  setToast('登録しました');
  disableLoading();
};

// created
(async () => {
  await getMemoList(); // updateRange()と非同期に実行
})();

onMounted(async () => {
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
