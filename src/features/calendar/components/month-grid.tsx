'use client';

import { cn } from 'cn';
import type { DaySum } from '@/features/calendar';
import { colorVar } from '@/features/master';
import { formatSignedPrice } from '@/lib/shared/domain/format';
import type { LaneMap, LaneSlot } from '../domain/event-lanes';
import type { MonthCell } from '../domain/month-grid';

// 月のカレンダーグリッド（原典 Calendar）。セルは「日付・その日の収支・予定の帯」を
// 縦に積む。帯が複数日にまたがるので、ライブラリのレイアウトに載せず自前で組む。
//
// 段（lane）の割り当ては domain/event-lanes.ts が持つ。ここは描くだけ。
//
// 月外の日はマスだけ置いて中身を描かない。今日の強調も無い（README D13）。

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'] as const;

export function MonthGrid({
  cells,
  daySums,
  lanes,
  selectedDate,
  onSelect
}: {
  cells: MonthCell[];
  // 日付 → その日の収支・祝日。
  daySums: Map<string, DaySum>;
  lanes: LaneMap;
  selectedDate: string;
  onSelect: (dateStr: string) => void;
}) {
  return (
    // グリッドは画面の左右いっぱいに広げる（デザインでは本文の余白を打ち消している）。
    <div className='-mx-4 border-y bg-card'>
      <div className='grid h-6 grid-cols-7 items-center text-center font-semibold text-[11px]'>
        {WEEKDAY_LABELS.map((label, index) => (
          <span
            className={cn(
              index === 0 && 'text-destructive',
              index === 6 && 'text-[var(--saturday)]',
              index > 0 && index < 6 && 'text-muted-foreground'
            )}
            key={label}
          >
            {label}
          </span>
        ))}
      </div>
      <div className='grid grid-cols-7'>
        {cells.map((cell) =>
          cell.isCurrentMonth ? (
            <DayCell
              cell={cell}
              daySum={daySums.get(cell.dateStr)}
              isSelected={cell.dateStr === selectedDate}
              key={cell.dateStr}
              onSelect={onSelect}
              slots={lanes.get(cell.dateStr) ?? []}
            />
          ) : (
            <div
              aria-hidden='true'
              className='h-18 border-line-soft border-t'
              key={cell.dateStr}
            />
          )
        )}
      </div>
    </div>
  );
}

// 日付の文字色。選択中・日曜/祝日・土曜の順に決まる。
function dayNumberClass({
  isSelected,
  isHoliday,
  weekday
}: {
  isSelected: boolean;
  isHoliday: boolean;
  weekday: number;
}): string {
  if (isSelected) {
    // 選択中はアクセントで塗る。曜日の色より優先する。
    return 'bg-primary font-bold text-primary-foreground';
  }
  if (weekday === 0 || isHoliday) {
    return 'text-destructive';
  }
  if (weekday === 6) {
    return 'text-[var(--saturday)]';
  }
  return 'text-foreground';
}

function DayCell({
  cell,
  daySum,
  slots,
  isSelected,
  onSelect
}: {
  cell: MonthCell;
  daySum: DaySum | undefined;
  slots: LaneSlot[];
  isSelected: boolean;
  onSelect: (dateStr: string) => void;
}) {
  const isHoliday = daySum?.holidayName != null;
  const sum = daySum?.sum ?? 0;

  return (
    <button
      aria-current={isSelected ? 'date' : undefined}
      aria-label={`${cell.dateStr}${isHoliday ? ` ${daySum?.holidayName}` : ''}`}
      className='flex h-18 flex-col gap-px border-line-soft border-t pt-[3px]'
      onClick={() => onSelect(cell.dateStr)}
      type='button'
    >
      <span
        className={cn(
          'flex size-6 items-center justify-center self-center rounded-full text-[13px]',
          dayNumberClass({ isHoliday, isSelected, weekday: cell.weekday })
        )}
      >
        {cell.day}
      </span>

      {/* 収支の行。値が無い日も高さを確保して帯の位置を揃える。
          sum は「支出=正」向きなので、符号を反転して出し、収入超過（負）のときにアクセントを当てる。 */}
      <span
        className={cn(
          'h-[11px] text-center text-[9px] leading-[11px]',
          sum < 0 ? 'text-primary' : 'text-muted-foreground'
        )}
      >
        {sum === 0 ? '' : formatSignedPrice(Math.abs(sum), sum > 0)}
      </span>

      <span className='flex flex-col gap-0.5'>
        {slots.map((slot) => (
          <LaneBar
            key={`${cell.dateStr}-${slot.lane}`}
            slot={slot}
            weekday={cell.weekday}
          />
        ))}
      </span>
    </button>
  );
}

// 帯 1 本。週をまたぐ帯は、週の端でも角を丸めて切れ目を見せる。
function LaneBar({ slot, weekday }: { slot: LaneSlot; weekday: number }) {
  if (slot.kind === 'empty') {
    return <span className='h-3.5' />;
  }

  if (slot.kind === 'more') {
    return (
      <span className='mx-0.5 h-3.5 truncate rounded-[3px] bg-fill-soft px-[3px] font-semibold text-[10px] text-muted-foreground leading-3'>
        他{slot.count}件
      </span>
    );
  }

  const { event, isStart, isEnd } = slot;
  // 週の左端・右端でも帯を閉じる。期間の端でなくても、行が変わるので角を丸める。
  const isLeftEdge = isStart || weekday === 0;
  const isRightEdge = isEnd || weekday === 6;
  const color = colorVar(event.colorName);

  return (
    <span
      className={cn(
        'h-3.5 truncate px-[3px] font-semibold text-[10px] leading-3',
        isLeftEdge && 'ml-0.5 rounded-l-[3px]',
        isRightEdge && 'mr-0.5 rounded-r-[3px]'
      )}
      style={
        event.isReminder
          ? // リマインダーは塗らずに枠線で描き分ける（予定と区別がつく）。
            {
              border: `1px solid ${color}`,
              color
            }
          : {
              // 面へ寄せた淡い地に、色そのままの文字。混ぜる割合はライト／ダークで
              // 違う（--band-mix）。
              backgroundColor: `color-mix(in srgb, ${color} var(--band-mix), var(--card))`,
              color
            }
      }
    >
      {/* 名前は帯の左端に出す。週をまたいだ続きも、行が変わると何の帯か分からなく
          なるので週頭で出し直す。途中の日は空にして繰り返しを避ける。 */}
      {isLeftEdge ? event.name : ''}
    </span>
  );
}
