import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import JapaneseHolidays from 'japanese-holidays';
import { DEMO_USER_INFO } from '~/utils/constants';
import type {
  DateString,
  DatetimeString,
  DbDatetimeString,
  MonthDayString,
  PickedDate,
  YearMonthNumObj,
  YearMonthObj,
  YearMonthString,
} from '~/utils/types/common';

const config = useRuntimeConfig();

// toISOString()ではUTC時刻を返すので9時間進めた時刻を渡す
const NowDateJst = () => {
  const now = new Date();
  now.setHours(now.getHours() + 9);
  return now;
};

const TimeUtility = {
  // ex.. RET: '2022-01-01'
  GetNowDate: (isDemo: boolean) => {
    if (isDemo) return DEMO_USER_INFO(config).NOW_DATE;
    return NowDateJst().toISOString().substring(0, 10);
  },
  // ex.. RET: 2022
  GetNowYear: (isDemo: boolean) => {
    if (isDemo) return DEMO_USER_INFO(config).NOW_YEAR;
    return Number(NowDateJst().toISOString().substring(0, 4));
  },
  // ex.. RET: {year: '2022', month: '01'}
  GetNowYearMonthObj: (isDemo: boolean): YearMonthObj => {
    const dateStr = isDemo
      ? DEMO_USER_INFO(config).NOW_DATE
      : NowDateJst().toISOString().substring(0, 10);
    const [year, month] = dateStr.split('-');
    return { year: year, month: month };
  },
  // ex.. PARAM: {$y: 2022, $M: 0, $D:31}, RET: '2022-01-31'
  GetPickedDateToDateStr: (d: PickedDate): DateString => {
    const month = ('0' + String(d.$M + 1)).slice(-2);
    const day = ('0' + String(d.$D)).slice(-2);
    return `${d.$y}-${month}-${day}`;
  },
  GetMonthDay: (m: number, d: number): MonthDayString => {
    const month = ('0' + String(m)).slice(-2);
    const day = ('0' + String(d)).slice(-2);
    return `${month}-${day}`;
  },
  // ex.. PARAM: 2022, RET: 2021
  PrevYear: (year: number) => {
    if (year === 2000) {
      alert('2000年以前のデータはサポートしません');
      return year;
    }
    return Number(year) - 1;
  },
  // ex.. PARAM: 2022, RET: 2021
  NextYear: (year: number) => {
    if (year === 2099) {
      alert('2100年以降のデータはサポートしません');
      return year;
    }
    return Number(year) + 1;
  },
  // ex.. PARAM: '2022-01-01', '2021-12-01', RET: false
  IsSameDateStr: (dateStr1: DateString, dateStr2: DateString) => {
    return dateStr1 === dateStr2;
  },
  // ex.. PARAM: '2022-01-01', '2021-12-01', RET: false
  IsSameYearMonth: (dateStr1: string, dateStr2: string) => {
    if (!dateStr1 || !dateStr2) return false;
    return dateStr1.substring(0, 7) == dateStr2.substring(0, 7);
  },
  // ex.. PARAM: '2022-01-01', RET: '2022-01-01 10:00:00'
  ConvertDateStrToDatetime: (dateStr: DateString): DatetimeString => {
    const now = NowDateJst();
    return dateStr + now.toISOString().substring(10, 19);
  },
  // ex.. PARAM: '2022-01-01 10:10:10', RET: '2022-01-01'
  ConvertDBResponseDatetimeToDateStr: (datetime: DatetimeString | DbDatetimeString): DateString => {
    return datetime.substring(0, 10);
  },
  // ex.. PARAM: '2022-01-01', RET: '2022-01'
  ConvertDateStrToYearMonth: (dateStr: DateString): YearMonthString => {
    if (!dateStr) {
      alert('予期せぬエラー: ConvertDateStrToYearMonth');
      throw new Error('ConvertDateStrToYearMonth');
    }
    return dateStr.substring(0, 7);
  },
  // ex.. PARAM: '2022-01-03T10:10:10+09:00', RET: '3日'
  ConvertDbDatetimeStringToJPDay: (d: DbDatetimeString): string => {
    const day = d.substring(8, 10);
    return `${Number(day)}日`;
  },
  // ex.. PARAM: '2022-01-01', RET: 2022年1月
  ConvertDateStrToJPYearMonth: (dateStr: DateString) => {
    const [year, month] = dateStr.split('-');
    return year + '年' + Number(month) + '月';
  },
  // ex.. PARAM: '2022-01-01', RET: 1月1日
  ConvertDateStrToJPDate: (dateStr: DateString) => {
    let [year, month, day] = dateStr.split('-');
    return Number(month) + '月' + Number(day) + '日';
  },
  // ex.. PARAM: '01-01', RET: 1月1日
  ConvertMonthDayToJPMonthDay: (monthDay: MonthDayString) => {
    let [month, day] = monthDay.split('-');
    return Number(month) + '月' + Number(day) + '日';
  },
  // ex.. PARAM: '2022-01-01', RET: new Date('2022-01-01')
  ConvertDateStrToDate: (dateStr: DateString) => {
    let [year, month, day] = dateStr.split('-');
    return new Date(Number(year), Number(month) - 1, Number(day));
  },
  // ex.. PARAM: '2022-01-01', RET: '元旦'
  GetHolidayName: (dateStr: DateString): string | null => {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split('-');
    return (
      JapaneseHolidays.isHolidayAt(new Date(Number(year), Number(month) - 1, Number(day))) ?? null
    );
  },
  // ex.. PARAM: '2022-01-01', RET: {year: '2022', month: '01'}
  ConvertDateStrToYearMonthObj: (dateStr: DateString): YearMonthObj => {
    let [year, month, day] = dateStr.split('-');
    return { year: year, month: month };
  },
  // ex.. PARAM: '2022-01-01', RET: {year: 2022, month: 0}
  ConvertDateStrToYearMonthNumObj: (dateStr: DateString): YearMonthNumObj => {
    let [year, month, day] = dateStr.split('-');
    return { year: Number(year), month: Number(month) - 1 };
  },
  // ex.. PARAM: {year: 2022, month: 0}, RET: {year: '2022', month: '01'},
  ConvertYearMonthNumObjToYearMonthObj: (obj: YearMonthNumObj): YearMonthObj => {
    const month = ('0' + String(obj.month + 1)).slice(-2);
    return { year: String(obj.year), month };
  },
  // ex.. PARAM: {year: 2022, month: 0}, RET: 2022年1月
  ConvertYearMonthNumObjToJPYearMonth: (obj: YearMonthNumObj): string => {
    const month = obj.month + 1;
    return `${obj.year}年${month}月`;
  },
  // ex.. PARAM: new Date('2022-01-01'), new Date('2022-01-02') , RET: '1月1日〜1月2日'
  // ex.. PARAM: new Date('2022-01-01'), new Date('invalid') , RET: '1月1日'
  ConvertDateObjsToJPPeriod: (startDateObj: Date, endDateObj: Date | null) => {
    const jpDate = (d: Date) => String(d.getMonth() + 1) + '月' + d.getDate() + '日';
    if (Number.isNaN(startDateObj.getDate())) return null;
    if (endDateObj === null || Number.isNaN(endDateObj.getDate())) return jpDate(startDateObj);
    return jpDate(startDateObj) + '〜' + jpDate(endDateObj);
  },
  // ex.. PARAM: ['2022-01-01', '2022-01-02'] , RET: '1/1 〜 1/2'
  ConvertDateStrsToPeriod: (startDateStr: DateString, endDateStr: DateString) => {
    if (!startDateStr || !endDateStr) throw new Error('ConvertDateStrsToPeriod');
    const [sYear, sMonth, sDay] = startDateStr.split('-');
    const [eYear, eMonth, eDay] = endDateStr.split('-');
    return sMonth + '/' + sDay + '〜' + eMonth + '/' + eDay;
  },
  // ex.. PARAM: ['2022-01-01', '2022-01-01'] , RET: true
  // ex.. PARAM: ['2022-01-01', '2022-02-01'] , RET: true
  // ex.. PARAM: ['2022-02-01', '2022-01-01'] , RET: false
  IsPeriod: (startDateStr: DateString, endDateStr: DateString) => {
    if (!startDateStr || !endDateStr) return false;
    const [sYear, sMonth, sDay] = startDateStr.split('-');
    const [eYear, eMonth, eDay] = endDateStr.split('-');
    if (sYear === eYear && sMonth === eMonth && sDay === eDay) return true;

    const sDateObj = new Date(Number(sYear), Number(sMonth) - 1, Number(sDay));
    const eDateObj = new Date(Number(eYear), Number(eMonth) - 1, Number(eDay));
    return sDateObj < eDateObj;
  },

  // ex.. PARAM: {year: '2022', month: '01'}, RET: '2022年'
  ConvertYearMonthObjToJPYear: (yearMonthObj: YearMonthObj) => {
    return yearMonthObj.year + '年';
  },
  // ex.. PARAM: {year: '2022', month: '01'}, RET: '2022年1月'
  ConvertYearMonthObjToJPYearMonth: (yearMonthObj: YearMonthObj) => {
    return yearMonthObj.year + '年' + Number(yearMonthObj.month) + '月';
  },
  // ex.. PARAM: {year: '2022', month: '01'}, RET: '2022-01'
  ConvertYearMonthObjToYearMonth: (yearMonthObj: YearMonthObj) => {
    return yearMonthObj.year + '-' + yearMonthObj.month;
  },
  // ex.. PARAM: {year: '2022', month: '01'}, RET: '2022-01-31 10:00:00'
  ConvertYearMonthObjToEndOfMonthDatetime: (o: YearMonthObj): DatetimeString => {
    const startOfMonthStr = `${o.year}-${o.month}-01`;
    const endOfMonth = dayjs(startOfMonthStr).endOf('month');
    const now = NowDateJst();
    return endOfMonth.format(format.Date) + now.toISOString().substring(10, 19);
  },
  // ex.. PARAM: {year: '2022', month: '01'}, RET: {year: 2022, month: 0},
  ConvertYearMonthObjToYearMonthNumObj: (obj: YearMonthObj): YearMonthNumObj => {
    return { year: Number(obj.year), month: Number(obj.month) - 1 };
  },
  // ex.. PARAM: {year: '2022', month: '01'}, RET: {year: '2021', month: '12'}
  PrevMonthInYearMonthObj: (yearMonthObj: YearMonthObj) => {
    if (yearMonthObj.year === '2000' && yearMonthObj.month === '01') {
      alert('2000年以前のデータはサポートしません');
      return yearMonthObj;
    }
    if (yearMonthObj.month === '01') {
      const prevYear = String(Number(yearMonthObj.year) - 1);
      return { year: prevYear, month: '12' };
    } else {
      const prevMonth = ('0' + (Number(yearMonthObj.month) - 1)).slice(-2);
      return { year: yearMonthObj.year, month: prevMonth };
    }
  },
  // ex.. PARAM: {year: 2022, month: 0}, RET: {year: 2021, month: 12}
  PrevMonthInYearMonthNumObj: (obj: YearMonthNumObj) => {
    if (obj.year === 2000 && obj.month === 0) {
      alert('2000年以前のデータはサポートしません');
      return obj;
    }

    if (obj.month === 0) {
      const prevYear = obj.year - 1;
      return { year: prevYear, month: 11 };
    } else {
      return { year: obj.year, month: obj.month - 1 };
    }
  },
  // ex.. PARAM: {year: '2022', month: '01'}, RET: {year: '2022', month: '02'}
  NextMonthInYearMonthObj: (yearMonthObj: YearMonthObj) => {
    if (yearMonthObj.year === '2099' && yearMonthObj.month === '12') {
      alert('2100年以降のデータはサポートしません');
      return yearMonthObj;
    }
    if (yearMonthObj.month === '12') {
      const nextYear = String(Number(yearMonthObj.year) + 1);
      return { year: nextYear, month: '01' };
    } else {
      const nextMonth = ('0' + (Number(yearMonthObj.month) + 1)).slice(-2);
      return { year: yearMonthObj.year, month: nextMonth };
    }
  },
  // ex.. PARAM: {year: 2022, month: 11}, RET: {year: 2022, month: 0}
  NextMonthInYearMonthNumObj: (obj: YearMonthNumObj) => {
    if (obj.year === 2099 && obj.month === 11) {
      alert('2100年以降のデータはサポートしません');
      return obj;
    }
    if (obj.month === 11) {
      return { year: obj.year + 1, month: 0 };
    } else {
      return { year: obj.year, month: obj.month + 1 };
    }
  },
  // ex.. PARAM: {start: dayjs('2022-01-01'), end: dayjs('2022-01-03')}, RET: [dayjs('2022-01-01'), dayjs('2022-01-02'), dayjs('2022-01-03')]
  PaddingDayjsDates: (start: Dayjs, end: Dayjs): Dayjs[] => {
    const ret: Dayjs[] = [];
    // 1000 回の最大値を設ける
    for (let i = 0; i < 1000; i++) {
      // i === 0の時は start と同じとなり、返り値に追加
      // tmpDate と end が同じときには、返り値に追加
      const tmpDate = start.add(i, 'd');
      if (tmpDate.isAfter(end)) break;
      ret.push(tmpDate);
    }
    return ret;
  },
  // その月に存在する日にちを返却する
  DaysByMonth: (month: number | null): number[] => {
    // month.value が null の場合は 31日まで
    const m = month ?? 1;
    // うるう年は考慮せず28日固定
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1] || 31;
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  },
};

export default TimeUtility;
