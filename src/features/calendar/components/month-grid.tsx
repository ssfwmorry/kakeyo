'use client';

import { cn } from 'cn';
import type { DaySum } from '@/features/calendar';
import { colorVar } from '@/features/master';
import { formatPrice, sumToneClass } from '@/lib/shared/domain/format';
import type { LaneMap, LaneSlot } from '../domain/event-lanes';
import type { MonthCell } from '../domain/month-grid';

// 月のカレンダーグリッド。段の割り当ては受け取るだけで、ここは描画に徹する。
//
// 祝日は日付を赤くするだけで、名前は出さない（1 マスに入れると帯を削ることになる）。
//
// 行の高さは指定せず、その週に積んだ帯の分だけ伸びるのに任せる。帯を畳まず全件出すので
// 段数が週で変わり、全週を一番多い週に合わせると予定の無い週まで間延びする。
//
// 月外の日も中身ごと描く。グリッドに出ている日はすべて押せて中身が見える方が、月末・月初を
// またぐ予定や収支を追いやすい（データは前月21日〜翌月9日で取得済みで、グリッドの端は
// 必ずその内側に収まる）。

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'] as const;

// 高さを週ごとに変えるには週が実体の要素である必要があるので、7 個ずつに切る。
function toWeeks(cells: MonthCell[]): MonthCell[][] {
  const weeks: MonthCell[][] = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }
  return weeks;
}

// 収支欄を出すかは週単位で決める。空の日も高さを取らないと同じ週の帯が縦にずれるが、
// 1 件も無い週まで空けると帯に回せる高さがその分だけ減る。
function hasAnySum(week: MonthCell[], daySums: Map<string, DaySum>): boolean {
  return week.some((cell) => (daySums.get(cell.dateStr)?.sum ?? 0) !== 0);
}

export function MonthGrid({
  cells,
  daySums,
  lanes,
  selectedDate,
  today,
  onSelect
}: {
  cells: MonthCell[];
  // キーは 'YYYY-MM-DD'。
  daySums: Map<string, DaySum>;
  lanes: LaneMap;
  selectedDate: string;
  today: string;
  onSelect: (dateStr: string) => void;
}) {
  return (
    <div className='-mx-3 border-y bg-card'>
      <div className='grid h-5 grid-cols-7 items-center text-center font-semibold text-[11px]'>
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
      {toWeeks(cells).map((week) => (
        <div className='grid grid-cols-7' key={week[0]?.dateStr}>
          {week.map((cell) => (
            <DayCell
              cell={cell}
              daySum={daySums.get(cell.dateStr)}
              hasWeekSum={hasAnySum(week, daySums)}
              isSelected={cell.dateStr === selectedDate}
              isToday={cell.dateStr === today}
              key={cell.dateStr}
              onSelect={onSelect}
              slots={lanes.get(cell.dateStr) ?? []}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function dayNumberClass({
  isSelected,
  isToday,
  isHoliday,
  weekday
}: {
  isSelected: boolean;
  isToday: boolean;
  isHoliday: boolean;
  weekday: number;
}): string {
  if (isSelected) {
    // 曜日・祝日の色より優先する。
    return 'bg-primary font-bold text-primary-foreground';
  }
  // 今日は塗らずに枠線で示す。塗りは「押した結果」に取っておき、印が重ならないようにする。
  const todayRing = isToday ? 'font-bold ring-1 ring-primary ring-inset' : '';
  if (weekday === 0 || isHoliday) {
    return cn('text-destructive', todayRing);
  }
  if (weekday === 6) {
    return cn('text-[var(--saturday)]', todayRing);
  }
  return cn('text-foreground', todayRing);
}

function DayCell({
  cell,
  daySum,
  slots,
  hasWeekSum,
  isSelected,
  isToday,
  onSelect
}: {
  cell: MonthCell;
  daySum: DaySum | undefined;
  slots: LaneSlot[];
  hasWeekSum: boolean;
  isSelected: boolean;
  isToday: boolean;
  onSelect: (dateStr: string) => void;
}) {
  const holidayName = daySum?.holidayName ?? null;
  const sum = daySum?.sum ?? 0;

  return (
    <button
      aria-current={isSelected ? 'date' : undefined}
      aria-label={`${cell.dateStr}${holidayName === null ? '' : ` ${holidayName}`}`}
      className={cn(
        'flex flex-col gap-px border-line-soft border-t pt-0.5 pb-1',
        // 月外の日は中身ごと薄くして、今月との境目を保つ。
        !cell.isCurrentMonth && 'opacity-45'
      )}
      onClick={() => onSelect(cell.dateStr)}
      type='button'
    >
      <span
        className={cn(
          'flex size-5 items-center justify-center self-center rounded-full text-[11px]',
          dayNumberClass({
            isHoliday: holidayName !== null,
            isSelected,
            isToday,
            weekday: cell.weekday
          })
        )}
      >
        {cell.day}
      </span>

      {/* 値が無い日も空のまま高さを取り、同じ週の帯の位置を揃える。 */}
      {hasWeekSum && (
        <span
          className={cn(
            'h-3 text-center font-semibold text-[10px] leading-3',
            sumToneClass(sum)
          )}
        >
          {sum === 0 ? '' : formatPrice(sum)}
        </span>
      )}

      <span className='flex flex-col gap-px'>
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

function LaneBar({ slot, weekday }: { slot: LaneSlot; weekday: number }) {
  if (slot.kind === 'empty') {
    return <span className='h-4' />;
  }

  const { event, isStart, isEnd } = slot;
  // 週の左端・右端でも帯を閉じる。期間の端でなくても、行が変わるので角を丸める。
  const isLeftEdge = isStart || weekday === 0;
  const isRightEdge = isEnd || weekday === 6;
  const color = colorVar(event.colorName);

  return (
    <span
      className={cn(
        'h-4 truncate px-[3px] font-semibold text-[11px] leading-4',
        // 帯の切れ目は外側の余白で作る。隣の日の別の予定と地が接すると 1 本に見える。
        isLeftEdge && 'ml-px rounded-l-[3px]',
        isRightEdge && 'mr-px rounded-r-[3px]'
      )}
      style={
        event.isReminder
          ? {
              border: `1px solid ${color}`,
              color
            }
          : {
              // 混ぜる割合はライト／ダークで違う（--band-mix）。
              backgroundColor: `color-mix(in srgb, ${color} var(--band-mix), var(--card))`,
              color
            }
      }
    >
      {/* 週をまたいだ続きも、行が変わると何の帯か分からなくなるので週頭で出し直す。 */}
      {isLeftEdge ? event.name : ''}
    </span>
  );
}
