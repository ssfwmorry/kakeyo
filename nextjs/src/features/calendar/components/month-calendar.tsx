'use client';

import type { EventClickArg, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import type { DateClickArg } from '@fullcalendar/interaction';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import { buildCalendarEvents } from '../domain/events';
import type { CalendarEvent, CalendarMonthData } from '../types';

// 月次カレンダー（FullCalendar dayGridMonth）の描画のみを担う Client Component。
// - 日付クリック（dateClick）→ 親へ YYYY-MM-DD を通知（日別 record 一覧を出す）。
// - 月移動・年月ジャンプは親（calendar-screen）の独自ヘッダーに一本化するため
//   FullCalendar 標準ツールバーは非表示（headerToolbar=false）にし、年月は key 再マウントで反映。
// - 高さは height='auto'（週数 5/6 と内容に応じてグリッド自身が伸び縮みし、親は固定の
//   箱を持たない）。
// - 祝日・選択日はクラス名だけ付け、見た目は styles/month-calendar.css に置く。
// - plan / reminder のイベントクリック → 親へ種別・id と押されたセルの日付を渡す
//   （親が日パネルをその日に切り替える）。
//
// FullCalendar の end は排他的（その日を含まない）ため、複数日 plan は end に +1 日する。
//
// 日付整形にここだけ dayjs を直 import する（規約の date.ts 経由の例外）。理由: 扱うのは
// FullCalendar が返す「ローカル暦日の Date / ms」であり、date.ts の責務（UTC↔JST 境界変換）
// とは別物。ここで tz 変換を通すと二重変換で日付キーがずれ、サーバ側の dateStr と突き合わない。
// ローカル暦日の素朴な format のみに用途を限定する。

type MonthCalendarProps = {
  data: CalendarMonthData;
  // 選択中の日付（YYYY-MM-DD）。該当セルへ is-selected を付けて輪郭で示す。
  selectedDate: string | null;
  onDateClick: (dateStr: string) => void;
  // plan / reminder イベントのクリック。clickedDate はクリックされたセルの日付
  // （複数日の予定を途中の日で押したとき、開始日ではなくその週の日を親へ渡す）。
  onEventClick?: (event: CalendarEvent, clickedDate: string) => void;
};

function toEventInput(event: CalendarEvent): EventInput {
  const base: EventInput = {
    title: event.title,
    start: event.start,
    allDay: true,
    // 種別と id を extendedProps に載せてクリック時に引けるようにする。
    extendedProps: {
      kind: event.kind,
      planId: event.planId,
      reminderId: event.reminderId
    }
  };
  if (event.kind === 'daySum') {
    // 見た目はクラス側（styles/month-calendar.css）に委ね、ここは色指定を無効化する。
    return {
      ...base,
      display: 'list-item',
      classNames:
        event.tone === 'income'
          ? ['calendar-day-sum', 'is-income']
          : ['calendar-day-sum'],
      color: 'transparent',
      textColor: 'inherit'
    };
  }
  // plan は塗り、reminder は枠線で区別する。
  if (event.kind === 'plan') {
    return {
      ...base,
      end: dayjs(event.end).add(1, 'day').format('YYYY-MM-DD'),
      backgroundColor: event.colorHex ?? undefined,
      borderColor: event.colorHex ?? undefined,
      textColor: '#ffffff'
    };
  }
  return {
    ...base,
    backgroundColor: '#ffffff',
    borderColor: event.colorHex ?? undefined,
    textColor: event.colorHex ?? undefined
  };
}

export function MonthCalendar({
  data,
  selectedDate,
  onDateClick,
  onEventClick
}: MonthCalendarProps) {
  const events = useMemo<EventInput[]>(
    () => buildCalendarEvents(data).map(toEventInput),
    [data]
  );

  // 祝日の日付集合（YYYY-MM-DD）。dayCellClassNames で該当セルへ is-holiday を付ける。
  const holidayDates = useMemo(
    () =>
      new Set(
        data.days
          .filter((day) => day.holidayName !== null)
          .map((day) => day.dateStr)
      ),
    [data.days]
  );

  // 対象月の 1 日を初期表示にする（前後の月の日も一部見える）。
  const initialDate = `${data.yearMonth}-01`;

  return (
    <FullCalendar
      // key で年月が変わったら再マウントし initialDate を反映させる。
      key={data.yearMonth}
      plugins={[dayGridPlugin, interactionPlugin]}
      initialView='dayGridMonth'
      initialDate={initialDate}
      locale='ja'
      height='auto'
      fixedWeekCount={false}
      selectable={false}
      // 月移動・年月ジャンプは親の独自ヘッダーに一本化するため標準ツールバーは出さない。
      headerToolbar={false}
      // 祝日セルへ is-holiday（日付数字を赤字化）、選択日セルへ is-selected（輪郭）を
      // 付与する（いずれも globals.css）。arg.date はローカル暦日なので dayjs で
      // そのまま 'YYYY-MM-DD' 化して突き合わせる。
      dayCellClassNames={(arg) => {
        const dateStr = dayjs(arg.date).format('YYYY-MM-DD');
        const classNames: string[] = [];
        if (holidayDates.has(dateStr)) {
          classNames.push('is-holiday');
        }
        if (dateStr === selectedDate) {
          classNames.push('is-selected');
        }
        return classNames;
      }}
      // ja ロケールは日付を「1日」形式で出すため、末尾の「日」を落として数字だけにする
      // （セルの横幅を稼ぐ）。
      dayCellContent={(arg) => arg.dayNumberText.replace('日', '')}
      events={events}
      dateClick={(arg: DateClickArg) => onDateClick(arg.dateStr)}
      eventClick={(arg: EventClickArg) => {
        const kind = arg.event.extendedProps.kind as CalendarEvent['kind'];
        if (kind === 'daySum') {
          // 収支ラベルのクリックはその日の選択として扱う。
          onDateClick(dayjs(arg.event.start ?? undefined).format('YYYY-MM-DD'));
          return;
        }
        const start = dayjs(arg.event.start ?? undefined).format('YYYY-MM-DD');
        // 押されたバーが載っているセル（data-date）。週をまたぐ予定は週ごとに
        // 分割描画され、各セグメントはその週の先頭日のセルに載る。
        const clickedDate =
          arg.el.closest('[data-date]')?.getAttribute('data-date') ?? start;
        onEventClick?.(
          {
            kind,
            start,
            end: dayjs(arg.event.end ?? arg.event.start ?? undefined).format(
              'YYYY-MM-DD'
            ),
            title: arg.event.title,
            colorHex: null,
            planId: (arg.event.extendedProps.planId as number | null) ?? null,
            reminderId:
              (arg.event.extendedProps.reminderId as number | null) ?? null,
            tone: null
          },
          clickedDate
        );
      }}
    />
  );
}
