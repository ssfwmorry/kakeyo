'use client';

import { cn } from 'cn';
import { CHART_HEIGHT, type ChartBar } from '@/lib/shared/domain/bar-chart';

// 棒グラフ（集計 › 推移と口座の残高推移で共用）。等分に並べ、棒をタップで選べる。
//
// 0 線をまたいで上下に伸びる棒（収支）と、上向きだけの積み上げ（カテゴリ別・口座）を
// 同じ部品で描く。積み上げは下から積むので、区画は column-reverse で並べる。
// 高さの計算は lib/shared/domain/bar-chart が持ち、ここは置くだけ。

export function StackedBarChart({
  bars,
  zeroTop,
  selectedKey,
  onSelect,
  toAriaLabel
}: {
  bars: ChartBar[];
  zeroTop: number;
  selectedKey: string;
  onSelect: (key: string) => void;
  // 「9月 収支 +130,000円」のように読み上げる文言。
  toAriaLabel: (bar: ChartBar) => string;
}) {
  // 本数ぶんの等分。空のときに repeat(0) にならないよう 1 で下限を張る。
  const columns = {
    gridTemplateColumns: `repeat(${Math.max(1, bars.length)}, minmax(0, 1fr))`
  };

  return (
    <>
      <div className='relative' style={{ height: CHART_HEIGHT }}>
        <span
          aria-hidden='true'
          className='absolute inset-x-0 h-px bg-border'
          style={{ top: zeroTop }}
        />
        <div className='absolute inset-0 grid' style={columns}>
          {bars.map((bar) => {
            const isSelected = bar.key === selectedKey;
            return (
              <button
                aria-label={toAriaLabel(bar)}
                aria-pressed={isSelected}
                className={cn(
                  'relative rounded-md',
                  isSelected && 'bg-fill-soft'
                )}
                key={bar.key}
                onClick={() => onSelect(bar.key)}
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

      <div className='-mt-1.5 grid' style={columns}>
        {bars.map((bar) => (
          <span
            className={cn(
              'text-center text-[10px]',
              bar.key === selectedKey
                ? 'font-bold text-foreground'
                : 'text-muted-foreground'
            )}
            key={bar.key}
          >
            {bar.label}
          </span>
        ))}
      </div>
    </>
  );
}
