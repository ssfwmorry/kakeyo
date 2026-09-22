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
// 旧 pages/calendar.vue の calendarOptions を App Router / React アダプタへ読み替え。
// - 日付クリック（dateClick）→ 親へ YYYY-MM-DD を通知（日別 record 一覧を出す）。
// - 月移動（prev/next のツールバー）→ 親へ表示中の年月（YYYY-MM）を通知して再取得。
// - plan / reminder のイベントクリックは段階実装（TODO）。今回は onEventClick で
//   種別と id を親へ渡すのみ（親側で編集導線は未実装）。
//
// FullCalendar の end は排他的（その日を含まない）ため、複数日 plan は end に +1 日する。
//
// 日付整形にここだけ dayjs を直 import する（規約の date.ts 経由の例外）。理由: 扱うのは
// FullCalendar が返す「ローカル暦日の Date / ms」であり、date.ts の責務（UTC↔JST 境界変換）
// とは別物。ここで toDateStringJst（tz 変換）を通すと二重変換で日付キーがずれ、サーバ側
// buildDaySumList が作る dateStr と突き合わない。ローカル暦日の素朴な format のみに用途を限定する。

type MonthCalendarProps = {
  data: CalendarMonthData;
  // 選択中の日付（YYYY-MM-DD）。ハイライト等には使わず、親が保持する状態を反映。
  selectedDate: string | null;
  onDateClick: (dateStr: string) => void;
  // 表示中の年月が変わったとき（前月/次月ボタン）に呼ぶ（YYYY-MM）。
  onMonthChange: (yearMonth: string) => void;
  // plan / reminder イベントのクリック（段階実装用のフック）。
  onEventClick?: (event: CalendarEvent) => void;
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
    // 収支ラベルは枠を持たない中央寄せテキスト。
    return {
      ...base,
      display: 'list-item',
      classNames: ['calendar-day-sum'],
      color: 'transparent',
      textColor: 'inherit'
    };
  }
  // plan は塗り、reminder は枠線（旧仕様の踏襲を簡略化）。
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
  onDateClick,
  onMonthChange,
  onEventClick
}: MonthCalendarProps) {
  const events = useMemo<EventInput[]>(
    () => buildCalendarEvents(data).map(toEventInput),
    [data]
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
      headerToolbar={{ left: 'title', center: '', right: 'prev,next' }}
      buttonText={{ prev: '前月', next: '次月' }}
      events={events}
      dateClick={(arg: DateClickArg) => onDateClick(arg.dateStr)}
      eventClick={(arg: EventClickArg) => {
        const kind = arg.event.extendedProps.kind as CalendarEvent['kind'];
        if (kind === 'daySum') {
          // 収支ラベルのクリックはその日の選択として扱う。
          onDateClick(dayjs(arg.event.start ?? undefined).format('YYYY-MM-DD'));
          return;
        }
        onEventClick?.({
          kind,
          start: dayjs(arg.event.start ?? undefined).format('YYYY-MM-DD'),
          end: dayjs(arg.event.end ?? arg.event.start ?? undefined).format(
            'YYYY-MM-DD'
          ),
          title: arg.event.title,
          colorHex: null,
          planId: (arg.event.extendedProps.planId as number | null) ?? null,
          reminderId:
            (arg.event.extendedProps.reminderId as number | null) ?? null
        });
      }}
      datesSet={(arg) => {
        // ツールバーの prev/next で表示範囲が変わったら「表示中央月」を親へ通知。
        // dayGridMonth の start は前月末を含むため、範囲中央の日付で年月を判定する。
        const midMs = (arg.start.getTime() + arg.end.getTime()) / 2;
        const yearMonth = dayjs(midMs).format('YYYY-MM');
        if (yearMonth !== data.yearMonth) {
          onMonthChange(yearMonth);
        }
      }}
    />
  );
}
