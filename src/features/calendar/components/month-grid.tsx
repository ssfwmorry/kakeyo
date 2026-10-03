'use client';

import { cn } from 'cn';
import type { DaySum } from '@/features/calendar';
import { colorVar } from '@/features/master';
import { formatPrice, sumToneClass } from '@/lib/shared/domain/format';
import type { LaneMap, LaneSlot } from '../domain/event-lanes';
import type { MonthCell } from '../domain/month-grid';

// 月のカレンダーグリッド（原典 Calendar）。段の割り当ては domain/event-lanes.ts が持ち、
// ここは描くだけ。
//
// 祝日は日付を赤くするだけで、名前は出さない（1 マスに入れると帯を削ることになる）。
//
// 行の高さは週ごとに変える。帯を畳まず全件出すので段数が週で変わり、全週を一番多い週に
// 合わせると予定の無い週まで間延びして月が見渡せなくなる。高さは指定せず、週の行に積んだ
// 帯の分だけ伸びるのに任せる。
//
// 月外の日も中身ごと描く。グリッドに出ている日はすべて押せて中身が見える方が、月末・月初を
// またぐ予定や収支を追いやすい（データは前月21日〜翌月9日で取得済みで、グリッドの端は
// 必ずその内側に収まる）。ただし対象月より淡くして、どこが今月かは一目で分かるようにする。

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'] as const;

// 行の高さは中身（その週の段数）で決まるので、週を実体の行要素にする。
function toWeeks(cells: MonthCell[]): MonthCell[][] {
  const weeks: MonthCell[][] = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }
  return weeks;
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
  // 日付 → その日の収支・祝日。
  daySums: Map<string, DaySum>;
  lanes: LaneMap;
  selectedDate: string;
  // 今日（YYYY-MM-DD）。選択日とは別の印で示す。
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

// 日付の文字色。選択中・日曜/祝日・土曜の順に決まる。
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
    // 選択中はアクセントで塗る。曜日の色より優先する。
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
  isSelected,
  isToday,
  onSelect
}: {
  cell: MonthCell;
  daySum: DaySum | undefined;
  slots: LaneSlot[];
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
        'flex flex-col gap-px border-line-soft border-t pt-[3px] pb-1',
        // 月外の日は中身ごと薄くして、今月との境目を保つ。
        !cell.isCurrentMonth && 'opacity-45'
      )}
      onClick={() => onSelect(cell.dateStr)}
      type='button'
    >
      <span
        className={cn(
          'flex size-6 items-center justify-center self-center rounded-full text-[13px]',
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

      {/* 値が無い日も高さを確保して帯の位置を揃える。 */}
      <span
        className={cn(
          'h-[13px] text-center font-semibold text-[11px] leading-[13px]',
          sumToneClass(sum)
        )}
      >
        {sum === 0 ? '' : formatPrice(sum)}
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

function LaneBar({ slot, weekday }: { slot: LaneSlot; weekday: number }) {
  if (slot.kind === 'empty') {
    return <span className='h-3.5' />;
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
