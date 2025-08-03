// https://fullcalendar.io/docs
import dayjs from 'dayjs';
import { getPlanList } from '~/api/supabase/plan';
import type { GetPlanListItem } from '~/api/supabase/plan.interface';
import { getMonthSum, getRecordList, postRecords } from '~/api/supabase/record';
import type { GetRecordListItem } from '~/api/supabase/record.interface';
import StringUtility from '~/utils/string';
import TimeUtility from '~/utils/time';
import type { DateString } from '~/utils/types/common';
import {
  eventType,
  type CalendarList,
  type EventInputExpanded,
} from '~/utils/types/domains/calender';

export const useCalendarStore = defineStore('calendarStore', () => {
  // actions
  const updateRange = async (focus: DateString, isDemoLogin: boolean, userUid: string) => {
    const payload1 = {
      yearMonth: TimeUtility.ConvertDateStrToYearMonth(focus),
    };
    const focusObj = TimeUtility.ConvertDateStrToYearMonthObj(focus);
    const prev = TimeUtility.PrevMonthInYearMonthObj(focusObj);
    const next = TimeUtility.NextMonthInYearMonthObj(focusObj);
    const payload2 = {
      start: prev.year + '-' + prev.month + '-21' + ' 00:00:00', // 全月の21日
      end: next.year + '-' + next.month + '-09' + ' 23:59:59', // 翌月の9日
    };
    const authParam = { isDemoLogin, userUid };

    // plannedRecord から、足りない record を登録(表示日付が、現在日付の6ヶ月後以前の場合, バッファで+1ヶ月)
    if (dayjs(focus).isBefore(dayjs().add(7, 'M'))) {
      const apiResPostRecords = await postRecords(authParam, payload1);
      assertApiResponse(apiResPostRecords);
    }

    const [apiResMonthSum, apiResGetRecords, apiResPlans] = await Promise.all([
      getMonthSum(authParam, payload1), // 月の収支を取得
      getRecordList(authParam, payload2), // record を取得
      getPlanList(authParam, payload2), // plan を追加
    ]);
    assertApiResponse(apiResMonthSum);
    assertApiResponse(apiResGetRecords);
    assertApiResponse(apiResPlans);

    const daySumList = getDaySumList(apiResGetRecords.data, focus);
    const events = createCalendarEvents(apiResPlans.data, daySumList);

    return {
      daySumList,
      monthSumStr: StringUtility.ConvertIntToShowPrefixStr(apiResMonthSum.data),
      events,
    };
  };
  const getDaySumList = (recordList: GetRecordListItem[], focus: DateString): CalendarList => {
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
          isInMonth: dayjs(dateStr).isSame(focus, 'month'),
        };
      }
      daySums[dateStr].records.push(record);
      daySums[dateStr] = {
        ...daySums[dateStr],
        sum:
          daySums[dateStr].sum + (record.isSelf || record.isSettlement === true ? recordPrice : 0),
      };
    });

    updatePaddingRecords(daySums, focus); // 毎日の record 用 event を定義

    return daySums;
  };
  const updatePaddingRecords = (calendarList: CalendarList, focus: DateString) => {
    const focusObj = TimeUtility.ConvertDateStrToYearMonthObj(focus);
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
          isInMonth: dayjs(dateStr).isSame(focus, 'month'),
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
  const createCalendarEvents = (
    plans: GetPlanListItem[],
    calendarList: CalendarList
  ): EventInputExpanded[] => {
    const events: EventInputExpanded[] = [];
    // plan 分を events に追加
    plans.forEach((plan) => {
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
    Object.keys(calendarList).forEach((dateStr) => {
      if (calendarList[dateStr].isHoliday) {
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
        title: daySum(calendarList, dateStr),
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
    return events;
  };
  const daySum = (calendarList: CalendarList, date: DateString) => {
    const sum = calendarList[date].sum;
    if (sum !== null && calendarList[date].records.length > 0) {
      return StringUtility.ConvertIntToShowStr(sum);
    } else {
      return '　'; // なんらかの文字列を表示させる必要がある、recordがない場合にeventの描画がずれるため
    }
  };

  return {
    updateRange,
  };
});
