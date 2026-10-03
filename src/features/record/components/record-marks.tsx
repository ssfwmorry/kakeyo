import { cn } from 'cn';
import { IconLock, IconShare, IconUpdate } from '@/components/icons';
import { colorVar } from '@/features/master';
import { amountToneClass, formatPrice } from '@/lib/shared/domain/format';
import { methodLineText } from '../domain/method-text';
import { recordLabels } from '../labels';

// record の行頭のタイル・名前の右に添える定期の印・右端の金額と方法。カレンダーの
// 日別リストと集計の明細で共有し、画面ごとに印の意味がぶれないようにする。

// カテゴリのアイコンは DB に無いので、カテゴリ色の淡い地に色の丸を置く。
// 共有の印をこのタイルに入れるのは、タイルが「行の種別を示す場所」として
// すでに読まれている領域だから。本文の行に印が割り込まず、アクセント色で
// 立てるより静かに伝わる。色もカテゴリ色にして地と同系に収める。
//
// 相手の立替の鍵も同じタイルの右下に載せる。「誰のお金か」はこのタイル、
// 「どこから来た記録か」は名前の行の印、と場所で意味を分ける。名前の行は狭い端末で
// truncate されるが、タイルは幅が固定で押し出されない。鍵は中立色にしてカテゴリ色の印と読み分ける。
export function RecordTile({
  colorName,
  isPair,
  isLocked
}: {
  colorName: string | null;
  isPair: boolean;
  isLocked: boolean;
}) {
  const color = colorVar(colorName);
  return (
    <span
      aria-hidden={isPair ? undefined : 'true'}
      className='relative flex size-9 shrink-0 items-center justify-center rounded-[10px]'
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
      {isLocked ? (
        // カードと同じ地色で縁取り、タイルを欠いたように見せて輪郭を立てる。
        <span className='-right-1 -bottom-1 absolute flex size-4.5 items-center justify-center rounded-full bg-card'>
          <IconLock
            aria-label={recordLabels.lock.partnerOnly}
            className='size-2.5 text-muted-foreground'
            role='img'
            strokeWidth={2.6}
          />
        </span>
      ) : null}
    </span>
  );
}

// 行の右端の金額と、その下の方法。方法をメモと混ぜず金額の下に置くのは、メモの有無で
// 位置が動かないようにするため。長い方法名が名前の列を潰さないよう幅を抑える。
export function RecordAmount({
  record,
  isPay,
  className
}: {
  record: Parameters<typeof methodLineText>[0] & { price: number };
  // 文字色の判定。精算など isPay=null の記録は呼び出し側が自分視点に解決して渡す。
  isPay: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'flex max-w-[45%] shrink-0 flex-col items-end gap-0.5',
        className
      )}
    >
      <span className={cn('font-semibold text-base', amountToneClass(isPay))}>
        {formatPrice(record.price)}
      </span>
      <span className='max-w-full truncate text-muted-foreground text-xs'>
        {methodLineText(record)}
      </span>
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
