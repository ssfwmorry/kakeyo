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
// - 月移動は親（calendar-screen）の独自ヘッダー（年月ジャンプ含む）に一本化するため
//   FullCalendar 標準ツールバーは非表示（headerToolbar=false）にし、年月は key 再マウントで反映。
//   → 旧 PaginationBar 同様に年月を 1 箇所へ集約し、標準タイトルとの重複を解消（差分リスト U-4）。
// - 祝日セルは dayCellClassNames で is-holiday を付与し、globals.css で日付数字を赤字化（B-11）。
// - plan / reminder のイベントクリック → 親へ種別と id を渡す（EventDetail で編集/削除）。
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
      // 祝日セルへ is-holiday を付与（globals.css で日付数字を赤字化）。arg.date は
      // ローカル暦日なので dayjs でそのまま 'YYYY-MM-DD' 化して集合と突き合わせる。
      dayCellClassNames={(arg) =>
        holidayDates.has(dayjs(arg.date).format('YYYY-MM-DD'))
          ? ['is-holiday']
          : []
      }
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
    />
  );
}
