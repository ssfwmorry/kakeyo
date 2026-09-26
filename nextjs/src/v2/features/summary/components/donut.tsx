import { colorVar } from '@/features/master';
import { DONUT_RADIUS, type DonutArc } from '../domain/breakdown';

// 内訳のドーナツ（原典 Summary）。180×180 の SVG に太さ 22 の弧を並べ、中央に合計を出す。
// 凡例やツールチップは持たず、内訳はすぐ下の一覧で読む。
//
// 弧が無い（合計 0）ときは薄い線の輪だけを出し、合計 0 と読めるようにする。

const SIZE = 180;
const CENTER = SIZE / 2;

export function Donut({
  arcs,
  label,
  total
}: {
  arcs: DonutArc[];
  // 「支出合計」「収入合計」。
  label: string;
  total: number;
}) {
  return (
    <div className='relative size-[180px]'>
      <svg
        aria-hidden='true'
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        width={SIZE}
      >
        <g
          fill='none'
          strokeWidth={22}
          transform={`rotate(-90 ${CENTER} ${CENTER})`}
        >
          {arcs.length === 0 ? (
            <circle
              cx={CENTER}
              cy={CENTER}
              r={DONUT_RADIUS}
              stroke='var(--line-soft)'
            />
          ) : (
            arcs.map((arc) => (
              <circle
                cx={CENTER}
                cy={CENTER}
                key={arc.key}
                r={DONUT_RADIUS}
                stroke={colorVar(arc.colorName)}
                strokeDasharray={`${arc.length} ${2 * Math.PI * DONUT_RADIUS}`}
                strokeDashoffset={arc.offset}
              />
            ))
          )}
        </g>
      </svg>
      <div className='absolute inset-0 flex flex-col items-center justify-center gap-0.5'>
        <span className='text-muted-foreground text-xs'>{label}</span>
        <span className='font-bold text-[22px]'>
          {total.toLocaleString('ja-JP')}
        </span>
        <span className='text-muted-foreground text-xs'>円</span>
      </div>
    </div>
  );
}
