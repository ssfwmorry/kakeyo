'use client';

import { cn } from 'cn';
import { CHART_HEIGHT, type TrendBar } from '../domain/trend';

// 推移の棒グラフ（原典 SumTrend）。12 本を等分に並べ、月をタップで選べる。
//
// 全体（収支）は 0 線をまたいで上下に、支出のみとカテゴリ別は上向きだけに伸びる。
// 積み上げは下から積むので、区画は column-reverse で並べる。
// 高さの計算は domain/trend.ts（buildSignedBars / buildStackedBars）が持つ。

export function TrendBarChart({
  bars,
  zeroTop,
  selectedMonth,
  onSelect,
  toAriaLabel
}: {
  bars: TrendBar[];
  zeroTop: number;
  selectedMonth: number;
  onSelect: (month: number) => void;
  // 「9月 収支 +130,000円」のように読み上げる文言。
  toAriaLabel: (bar: TrendBar) => string;
}) {
  return (
    <>
      <div className='relative' style={{ height: CHART_HEIGHT }}>
        <span
          aria-hidden='true'
          className='absolute inset-x-0 h-px bg-border'
          style={{ top: zeroTop }}
        />
        <div className='absolute inset-0 grid grid-cols-12'>
          {bars.map((bar) => {
            const isSelected = bar.month === selectedMonth;
            return (
              <button
                aria-label={toAriaLabel(bar)}
                aria-pressed={isSelected}
                className={cn(
                  'relative rounded-md',
                  isSelected && 'bg-fill-soft'
                )}
                key={bar.month}
                onClick={() => onSelect(bar.month)}
                style={{ height: CHART_HEIGHT }}
                type='button'
              >
                <span
                  className='-ml-[7px] absolute left-1/2 flex w-3.5 flex-col-reverse overflow-hidden'
                  style={{
                    top: bar.top,
                    height: bar.height,
                    borderRadius: bar.isNegative
                      ? '0 0 4px 4px'
                      : '4px 4px 0 0',
                    opacity: isSelected ? 1 : 0.45
                  }}
                >
                  {bar.segments.map((segment) => (
                    <span
                      className='block shrink-0'
                      key={segment.key}
                      style={{
                        height: segment.height,
                        backgroundColor: segment.color
                      }}
                    />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className='-mt-1.5 grid grid-cols-12'>
        {bars.map((bar) => (
          <span
            className={cn(
              'text-center text-[10px]',
              bar.month === selectedMonth
                ? 'font-bold text-foreground'
                : 'text-muted-foreground'
            )}
            key={bar.month}
          >
            {bar.month}月
          </span>
        ))}
      </div>
    </>
  );
}
