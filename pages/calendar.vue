<template>
  <v-container
    v-touch="{
      left: moveNext,
      right: movePrev,
    }"
    class="pa-1 h-100 bg-white"
  >
    <PaginationBar
      mode="MONTH"
      :subtitle="!loading ? '収支：' + monthSumStr + ' 円' : '　'"
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
          :icon="allRecordListOrder === OrderBy.DESC ? $ICONS.CHEVRON_DOWN : $ICONS.CHEVRON_UP"
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
          @click:append="handleInsertMemo()"
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

    <!-- TODO表示 -->
    <v-row no-gutters class="mb-2 pl-2">
      <v-col class="pl-2">
        <v-chip
          v-for="memo in memoList"
          :key="memo.id"
          closable
          label
          class="mr-2 mb-1"
          @click:close="handleDeleteMemo(memo.id)"
          ><v-icon small v-if="!!memo.pairId" class="mr-1">{{ $ICONS.SHARE }}</v-icon>
          {{ memo.memo }}
        </v-chip>
      </v-col>
    </v-row>

    <!-- plan / reminder 表示 -->
    <v-row v-if="selectedPlan" no-gutters class="px-2">
      <v-col>
        <PlanCard
          :plan="selectedPlan"
          @edit="goPlanEditPage()"
          @delete="deleteReminderPlan"
          class="mb-2 w-100"
        />
      </v-col>
    </v-row>
    <v-row v-else-if="selectedReminder" no-gutters class="px-2">
      <v-col>
        <ReminderCard :reminder="selectedReminder" class="mb-2 w-100" />
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
import type { CalendarOptions, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { type DateClickArg } from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/vue3';
import type { GetMemoListOutput } from '~/api/supabase/memo.interface';
import type { GetRecordListItem } from '~/api/supabase/record.interface';
import type { GetShortCutListItem } from '~/api/supabase/shortCut.interface';
import PlanCard from '~/components/PlanCard.vue';
import { PAGE, SettlementRecord } from '~/utils/constants';
import StringUtility from '~/utils/string';
import TimeUtility from '~/utils/time';
import { OrderBy, type DateString, type Id, type YearMonthNumObj } from '~/utils/types/common';
import {
  eventType,
  type CalendarList,
  type DateRecordList,
  type EventGetPlan,
  type EventGetReminder,
  type ExternalEvent,
} from '~/utils/types/domains/calendar';
import {
  RouterParamKey,
  type PageQueryParameter,
  type Plan,
  type Record_,
  type RouterQueryNoteToCalendar,
  type RouterQueryPlanToCalendar,
} from '~/utils/types/page';

const loadingStore = useLoadingStore();
const { loading } = storeToRefs(loadingStore);
const { enableLoading, disableLoading } = loadingStore;
const [authStore, pairStore] = [useAuthStore(), usePairStore()];
const { isDemoLogin, isExistPair, pairId, userUid } = storeToRefs(authStore);
const { isPair } = storeToRefs(pairStore);
const { setIsPair } = usePairStore();
const { $ICONS } = useNuxtApp();
const { setRouterParam } = useRouterParamStore();
const route = useRoute();
const router = useRouter();
const { deleteMemo, deletePlan, getMemoList, getShortCutList, insertMemo, upsertRecord } =
  useSupabase();
const { updateRange: calendarUpdateRange } = useCalendarStore();
const { setToast } = useToastStore();

const focus = ref<DateString | null>(null);
const fullCalendar = ref<InstanceType<typeof FullCalendar> | undefined>();
const daySumList = ref<CalendarList>({});
const memoList = ref<GetMemoListOutput['data']>([]);
const shortCutList = ref<GetShortCutListItem[]>([]);
const selectedHoliday = ref<string | null>(null);
const selectedDateRecords = ref<DateRecordList[]>([]);
const selectedDate = ref<DateString | null>(null);
const selectedPlan = ref<EventGetPlan | null>(null);
const selectedReminder = ref<EventGetReminder | null>(null);
const monthSumStr = ref('');
const allRecordListOrder = ref<OrderBy>(OrderBy.DESC);
const isShowMemoInput = ref(false);
const isExistsShortCut = ref(false);
const isShowShortCut = ref(false);
const isPairMemo = ref(false);
const memoText = ref<string | null>(null);
const calendarOptions = ref<CalendarOptions>({
  plugins: [dayGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  contentHeight: 'auto',
  fixedWeekCount: false,
  // locale: 'ja',
  selectable: false, // eventを選択すると背景色が白になるのでtrueにする場合には要調整
  eventOrder: 'type,start,-duration,allDay,title',
  events: [],
  dateClick: (arg: DateClickArg) => showDateRecords(arg.dateStr),
  eventClick: (arg: EventClickArg) => showEvent(arg.event),
});

const focusObj = computed(() => {
  if (focus.value === null) return null;
  return TimeUtility.ConvertDateStrToYearMonthNumObj(focus.value);
});

const moveMonth = async (direction: 'prev' | 'next') => {
  if (!focus.value) throw new Error(`move${direction}`);
  const focusObj = TimeUtility.ConvertDateStrToYearMonthObj(focus.value);
  const newObj =
    direction === 'prev'
      ? TimeUtility.PrevMonthInYearMonthObj(focusObj)
      : TimeUtility.NextMonthInYearMonthObj(focusObj);
  focus.value = `${newObj.year}-${newObj.month}-01`;
  await updateRange();
};
const movePrev = async () => {
  await moveMonth('prev');
};
const moveNext = async () => {
  await moveMonth('next');
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

  fullCalendar.value.getApi().gotoDate(focus.value);
  const {
    daySumList: tmpDaySumList,
    monthSumStr: tmpMonthSumStr,
    events,
  } = await calendarUpdateRange(focus.value, isDemoLogin.value, userUid.value, pairId.value);

  // レンダリングされるタイミングを揃えるため、全て取得してから、data を更新する
  daySumList.value = tmpDaySumList;
  monthSumStr.value = tmpMonthSumStr;
  calendarOptions.value.events = events;
  disableLoading();
};
const showEvent = (event: EventClickArg['event']) => {
  const external = event.extendedProps as ExternalEvent;
  if (external.type === eventType.RECORD || external.type === eventType.HOLIDAY) {
    showDateRecords(external.startStr);
  } else if (external.type === eventType.REMINDER) {
    const reminder: EventGetReminder = {
      title: event.title,
      textColor: event.textColor,
      borderColor: event.borderColor,
      backgroundColor: event.backgroundColor,
      type: external.type,
      reminderId: external.reminderId,
      isPair: external.isPair,
      reminderDate: external.reminderDate,
      memo: external.memo,
      reminderColor: external.reminderColor,
    };

    selectedDate.value = reminder.reminderDate;
    selectedDateRecords.value = [];
    selectedPlan.value = null;
    selectedReminder.value = reminder;
  } else {
    const plan: EventGetPlan = {
      title: event.title,
      start: event.start ?? new Date(),
      end: event.end,
      allDay: true,
      textColor: event.textColor,
      borderColor: event.borderColor,
      backgroundColor: event.backgroundColor,
      classNames: [],
      startStr: external.startStr,
      endStr: external.endStr,
      dbEnd: external.dbEnd,
      type: external.type,
      planId: external.planId,
      isPair: external.isPair,
      isFromReminder: external.isFromReminder,
      memo: external.memo,
      typeId: external.typeId,
      typeName: external.typeName,
    };

    selectedDate.value = plan.startStr;
    selectedDateRecords.value = [];
    selectedReminder.value = null;
    selectedPlan.value = plan;
  }
};

const deleteReminderPlan = async () => {
  const idOk = window.confirm('削除してもよいですか？');
  if (!idOk) return;

  const planId = selectedPlan.value?.planId;
  if (!planId) throw new Error('deletePlan');

  const payload = { id: planId };
  const apiRes = await deletePlan({ isDemoLogin: isDemoLogin.value }, payload);
  assertApiResponse(apiRes);

  setToast('削除しました');
  selectedPlan.value = null;
  await updateRange();
};

const showDateRecords = (dateStr: DateString) => {
  selectedReminder.value = null;
  selectedPlan.value = null;
  selectedDate.value = dateStr;
  selectedDateRecords.value = [daySumList.value[dateStr]];
};
const showAllRecords = () => {
  const toggleOrder = () => {
    allRecordListOrder.value =
      allRecordListOrder.value === OrderBy.DESC ? OrderBy.ASC : OrderBy.DESC;
  };

  selectedPlan.value = null;
  selectedHoliday.value = null;
  const sortedAndFilteredList = Object.values(daySumList.value)
    .sort((a, b) => {
      if (allRecordListOrder.value === OrderBy.ASC) {
        return a.dateStr < b.dateStr ? -1 : 1; // 昇順
      }
      return a.dateStr < b.dateStr ? 1 : -1; // 降順
    })
    .filter((item) => item.isInMonth && item.records.length > 0);
  selectedDateRecords.value = sortedAndFilteredList;

  toggleOrder();
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
  if (
    selectedPlan.value === null ||
    selectedPlan.value.typeId === null ||
    selectedPlan.value.typeName === null
  )
    throw new Error('goPlanEditPage');
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

const syncMemoList = async () => {
  const apiRes = await getMemoList({
    userUid: userUid.value,
    pairId: pairId.value,
  });
  assertApiResponse(apiRes);

  memoList.value = apiRes.data;
};
const handleInsertMemo = async () => {
  if (!memoText.value) {
    setToast('空です', 'error');
    return;
  }
  enableLoading();
  if (isPairMemo.value === true && pairId.value === null) {
    alert('予期せぬ状態: handleInsertMemo');
    return;
  }
  const payload = { memo: memoText.value, isPair: isPairMemo.value };
  const apiRes = await insertMemo(
    {
      isDemoLogin: isDemoLogin.value,
      userUid: userUid.value,
      pairId: pairId.value,
    },
    payload
  );
  assertApiResponse(apiRes);

  setToast('登録しました');
  await syncMemoList();
  resetMemoInput();
  disableLoading();
};
const resetMemoInput = () => {
  isShowMemoInput.value = false;
  memoText.value = null;
};
const handleDeleteMemo = async (id: Id) => {
  enableLoading();
  const apiRes = await deleteMemo({ isDemoLogin: isDemoLogin.value }, { id });
  assertApiResponse(apiRes);

  setToast('削除しました');
  await syncMemoList();
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
const syncShortCutList = async () => {
  const apiRes = await getShortCutList({ userUid: userUid.value });
  assertApiResponse(apiRes);

  isExistsShortCut.value = apiRes.data.length > 0;
  shortCutList.value = apiRes.data;
};

// created
(async () => {
  // updateRange()と非同期に実行
  await Promise.all([syncMemoList(), syncShortCutList()]);
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
</style>
