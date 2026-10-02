import { cn } from 'cn';
import { IconShare, IconUpdate } from '@/components/icons';
import { colorVar } from '@/features/master';

// record の行頭のタイルと、名前の右に添える定期の印。カレンダーの日別リストと
// 集計の明細で共有し、画面ごとに印の意味がぶれないようにする。

// カテゴリのアイコンは DB に無いので、カテゴリ色の淡い地に色の丸を置く。
// 共有の印をこのタイルに入れるのは、タイルが「行の種別を示す場所」として
// すでに読まれている領域だから。本文の行に印が割り込まず、アクセント色で
// 立てるより静かに伝わる。色もカテゴリ色にして地と同系に収める。
export function RecordTile({
  colorName,
  isPair
}: {
  colorName: string | null;
  isPair: boolean;
}) {
  const color = colorVar(colorName);
  return (
    <span
      aria-hidden={isPair ? undefined : 'true'}
      className='flex size-9 shrink-0 items-center justify-center rounded-[10px]'
      style={{
        backgroundColor: `color-mix(in srgb, ${color} var(--band-mix), var(--card))`
      }}
    >
      {isPair ? (
        <IconShare
          aria-label='共有'
          className='size-4'
          role='img'
          strokeWidth={2.2}
          style={{ color }}
        />
      ) : (
        <span
          className='size-3 rounded-full'
          style={{ backgroundColor: color }}
        />
      )}
    </span>
  );
}

// 定期の記録から実体化された record の印。「どこから来た記録か」の補足なので補足色。
export function PlannedRecordMark({
  isPlannedRecord,
  size = 14
}: {
  isPlannedRecord: boolean;
  // 15px の行は 14、精算の立替カード（13px）は 13。
  size?: 13 | 14;
}) {
  if (!isPlannedRecord) {
    return null;
  }
  return (
    <IconUpdate
      aria-label='定期の記録'
      className={cn(
        'shrink-0 text-muted-foreground',
        size === 14 ? 'size-3.5' : 'size-[13px]'
      )}
      role='img'
      strokeWidth={2.2}
    />
  );
}
