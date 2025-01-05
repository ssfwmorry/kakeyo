import { DEMO_USER_INFO } from '@/constants';
import type { DateString, DatetimeString, YearMonthObj } from '@/types/common';
import type { Dayjs } from 'dayjs';
import JapaneseHolidays from 'japanese-holidays';
const config = useRuntimeConfig();
const StartHHMMSS = '000000';
const EndHHMMSS = '235959';
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
  // ex.. PARAM: '2022-01-15', RET: '2022-01-01'
  ConvertDateStrToMonthFirstDateStr: (dateStr: string) => {
    return dateStr.substring(0, 7) + '-01';
  },
  // ex.. PARAM: '2022-01-01', RET: '2022-01-01 10:00:00'
  ConvertDateStrToDatetime: (dateStr: DateString): DatetimeString => {
    const now = NowDateJst();
    return dateStr + now.toISOString().substring(10, 19);
  },
  // ex.. PARAM: '2022-01-01 10:10:10', RET: '2022-01-01'
  ConvertDBResponseDatetimeToDateStr: (dBResDatetime: DatetimeString): DateString => {
    if (!dBResDatetime) throw new Error('ConvertDBResponseDatetimeToDateStr');

    return dBResDatetime.substring(0, 10);
  },
  // ex.. PARAM: '2022-01-01', RET: '2022-01'
  ConvertDateStrToYearMonth: (dateStr: string) => {
    if (!dateStr) return null;
    return dateStr.substring(0, 7);
  },
  // ex.. PARAM: '2022-01-01', RET: 2022年1月
  ConvertDateStrToJPYearMonth: (dateStr: DateString) => {
    const [year, month] = dateStr.split('-');
    return year + '年' + Number(month) + '月';
  },
  // ex.. PARAM: '2022-01-01', RET: 1月1日
  ConvertDateStrToJPDate: (dateStr: string) => {
    if (!dateStr) return null;
    let [year, month, day] = dateStr.split('-');
    return Number(month) + '月' + Number(day) + '日';
  },
  // ex.. PARAM: '2022-01-01', RET: new Date('2022-01-01')
  ConvertDateStrToDate: (dateStr: string) => {
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
  ConvertDateStrToYearMonthObj: (dateStr: string) => {
    if (!dateStr) return null;
    let [year, month, day] = dateStr.split('-');
    return { year: year, month: month };
  },
  // ex.. PARAM: new Date('invalid'), RET: false
  IsInvalidDate: (dateObj: any) => {
    return dateObj === null || Number.isNaN(dateObj.getDate());
  },
  // ex.. PARAM: new Date('2022-01-01'), RET: '2022-01-01'
  ConvertDateObjToDateStr: (dateObj: any) => {
    if (dateObj === null || Number.isNaN(dateObj.getDate())) return null; // IsInvalidDate()
    const day = ('0' + dateObj.getDate()).slice(-2);
    return (
      dateObj.getFullYear() + '-' + ('0' + String(dateObj.getMonth() + 1)).slice(-2) + '-' + day
    );
  },
  // ex.. PARAM: new Date('2022-01-01'), new Date('2022-01-01') , RET: true
  IsEqualDate: (dateObj1: any, dateObj2: any) => {
    if (dateObj1 === null || dateObj2 === null) return false;
    if (Number.isNaN(dateObj1.getDate()) || Number.isNaN(dateObj2.getDate())) return false;
    return (
      dateObj1.getFullYear() === dateObj2.getFullYear() &&
      dateObj1.getMonth() === dateObj2.getMonth() &&
      dateObj1.getDate() === dateObj2.getDate()
    );
  },
  // ex.. PARAM: new Date('2022-01-01'), new Date('2022-01-02') , RET: '1月1日〜1月2日'
  // ex.. PARAM: new Date('2022-01-01'), new Date('invalid') , RET: '1月1日'
  ConvertDateObjsToJPPeriod: (startDateObj: any, endDateObj: any) => {
    const jpDate = (d: any) => String(d.getMonth() + 1) + '月' + d.getDate() + '日';
    if (Number.isNaN(startDateObj.getDate())) return null; // IsInvalidDate()
    if (endDateObj === null || Number.isNaN(endDateObj.getDate())) return jpDate(startDateObj); // IsInvalidDate()
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
  ConvertYearMonthObjToJPYear: (yearMonthObj: any) => {
    return yearMonthObj.year + '年';
  },
  // ex.. PARAM: {year: '2022', month: '01'}, RET: '2022年1月'
  ConvertYearMonthObjToJPYearMonth: (yearMonthObj: any) => {
    return yearMonthObj.year + '年' + Number(yearMonthObj.month) + '月';
  },
  // ex.. PARAM: {year: '2022', month: '01'}, RET: '2022-01'
  ConvertYearMonthObjToYearMonth: (yearMonthObj: any) => {
    return yearMonthObj.year + '-' + yearMonthObj.month;
  },
  // ex.. PARAM: {year: '2022', month: '01'}, RET: {year: '2021', month: '12'}
  PrevMonthInYearMonthObj: (yearMonthObj: any) => {
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
  // ex.. PARAM: {year: '2022', month: '01'}, RET: {year: '2022', month: '02'}
  NextMonthInYearMonthObj: (yearMonthObj: any) => {
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
};

export default TimeUtility;
