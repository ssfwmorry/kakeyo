import type { MonthEndTrend } from '../domain/month-ends';

// 総資産の推移（原典 Bank のカード内のグラフ）。直近 6 か月の月末時点を折れ線で結び、
// 終点に丸を打つ。横罫線 3 本だけで、目盛り・ツールチップは無い（増減の形だけを見せる）。
//
// 326×96 の座標系で描き、横幅はカードに合わせて伸縮させる。X 軸のラベルは SVG の外に
// 置き、6 つを等間隔に並べて点の位置と揃える。

const WIDTH = 326;
const HEIGHT = 96;
const LEFT = 4;
const RIGHT = 322;
const TOP = 12;
const BOTTOM = 84;
const GRID_YS = [31.5, 63.5, 95.5];

export function TotalTrendChart({ trend }: { trend: MonthEndTrend }) {
  const plotted = trend.points
    .map((point, index) => ({ index, sum: point.sum }))
    .filter(
      (point): point is { index: number; sum: number } => point.sum !== null
    );
  const sums = plotted.map((point) => point.sum);
  const min = Math.min(...sums);
  const max = Math.max(...sums);
  const stepX = (RIGHT - LEFT) / (trend.points.length - 1);
  // 値の幅が 0（全部同じ）なら中央に水平線を引く。
  const toY = (sum: number) =>
    max === min
      ? (TOP + BOTTOM) / 2
      : BOTTOM - ((sum - min) / (max - min)) * (BOTTOM - TOP);
  const coordinates = plotted.map((point) => ({
    x: LEFT + point.index * stepX,
    y: toY(point.sum)
  }));
  const last = coordinates.at(-1);

  return (
    <div className='flex flex-col gap-2.5'>
      <svg
        aria-label='直近6か月の総資産の推移'
        className='h-auto w-full'
        fill='none'
        role='img'
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      >
        <path
          d={GRID_YS.map((y) => `M0 ${y}H${WIDTH}`).join('')}
          stroke='var(--line-soft)'
        />
        <polyline
          points={coordinates.map(({ x, y }) => `${x},${y}`).join(' ')}
          stroke='var(--primary)'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={2.5}
        />
        {last === undefined ? null : (
          <circle cx={last.x} cy={last.y} fill='var(--primary)' r={4} />
        )}
      </svg>
      <div className='flex justify-between text-[11px] text-muted-foreground'>
        {trend.points.map((point) => (
          <span key={point.yearMonth}>{point.label}</span>
        ))}
      </div>
    </div>
  );
}
