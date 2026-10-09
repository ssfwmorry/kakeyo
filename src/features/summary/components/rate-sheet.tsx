'use client';

import { cn } from 'cn';
import { SheetHeader } from '@/components/sheet-header';
import { BottomSheet, BottomSheetContent } from '@/components/ui/bottom-sheet';
import { colorVar } from '@/features/master';
import type { PairedRecordItem, PairUserNames } from '@/features/record';
import { toDateStringJst } from '@/lib/shared/domain/date';
import { formatSlashDateWeekJa } from '@/lib/shared/domain/format';
import {
  HALF_RATE_INDEX,
  RATE_CAPTION_LIST,
  RATE_LABEL_LIST,
  RATE_SHEET_ORDER,
  rateColor,
  rateTint
} from '../domain/settlement-rate';
import { insteadByName, settlementManyTitle, summaryLabels } from '../labels';
import { categoryName } from './settlement-text';

// 精算率を選ぶシート（原典 SumSettleRate）。対象の立替を上に示し、11 段階の率から
// 1 つ選ぶ。選んだ時点で割り当ててシートを閉じる（「決定」は置かない）。
//
// 対象は 1 件とは限らない。複数件をまとめて割り当てるときは、上の見出しを件数と
// 合計に替える。
//
// 率は左列に「自分が多く負担」、右列に「相手が多く負担」を対にして並べ、割り勘だけを
// 下に 1 段で出す。

export function RateSheet({
  records,
  names,
  rateIndex,
  onSelect,
  onOpenChange
}: {
  // 率を割り当てる対象。1 件以上。
  records: PairedRecordItem[];
  names: PairUserNames;
  // いま割り当てている率。未割当・複数件で揃っていないなら undefined。
  rateIndex: number | undefined;
  onSelect: (rateIndex: number) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const labels = summaryLabels.settlement.rateSheet;

  return (
    <BottomSheet onOpenChange={onOpenChange} open>
      <BottomSheetContent aria-label={labels.heading}>
        <SheetHeader
          left='close'
          onLeft={() => onOpenChange(false)}
          title={labels.heading}
        />

        {records.length === 1 ? (
          <SingleTarget names={names} record={records[0]} />
        ) : (
          <ManyTarget records={records} />
        )}

        <div className='flex justify-between px-1 font-semibold text-muted-foreground text-xs'>
          <span>{labels.hintLeft}</span>
          <span>{labels.hintCenter}</span>
          <span>{labels.hintRight}</span>
        </div>

        <div className='grid grid-cols-2 gap-2'>
          {RATE_SHEET_ORDER.map((index) => (
            <RateButton
              index={index}
              isSelected={rateIndex === index}
              key={index}
              onSelect={() => onSelect(index)}
            />
          ))}
        </div>

        <RateButton
          half
          index={HALF_RATE_INDEX}
          isSelected={rateIndex === HALF_RATE_INDEX}
          onSelect={() => onSelect(HALF_RATE_INDEX)}
        />
      </BottomSheetContent>
    </BottomSheet>
  );
}

function SingleTarget({
  record,
  names
}: {
  record: PairedRecordItem;
  names: PairUserNames;
}) {
  const sub = [
    formatSlashDateWeekJa(toDateStringJst(record.datetime)),
    insteadByName(record.isSelf ? names.self : names.partner),
    record.memo
  ]
    .filter((part) => part !== null && part !== '')
    .join(' · ');

  return (
    <div className='flex h-14 items-center gap-3 rounded-[14px] bg-card px-3.5'>
      <span
        aria-hidden='true'
        className='size-2.5 shrink-0 rounded-full'
        style={{
          backgroundColor: colorVar(record.typeColorClassificationName)
        }}
      />
      <span className='flex min-w-0 flex-grow flex-col gap-0.5'>
        <span className='truncate text-[15px]'>{categoryName(record)}</span>
        <span className='truncate text-muted-foreground text-xs'>{sub}</span>
      </span>
      <span className='shrink-0 whitespace-nowrap font-bold text-[17px]'>
        {record.price.toLocaleString('ja-JP')}円
      </span>
    </div>
  );
}

function ManyTarget({ records }: { records: PairedRecordItem[] }) {
  const sum = records.reduce((total, record) => total + record.price, 0);

  return (
    <div className='flex flex-col gap-2 rounded-[14px] bg-card px-3.5 py-3'>
      <span className='font-bold text-[15px]'>
        {settlementManyTitle(records.length, sum)}
      </span>
      <div className='flex flex-wrap gap-1'>
        {records.map((record) => (
          <span
            className='flex h-6 items-center gap-1.5 rounded-xl bg-background px-2 text-xs'
            key={record.id}
          >
            <span
              aria-hidden='true'
              className='size-2 shrink-0 rounded-full'
              style={{
                backgroundColor: colorVar(record.typeColorClassificationName)
              }}
            />
            <span className='max-w-28 truncate'>{categoryName(record)}</span>
            <span className='text-muted-foreground'>
              {record.price.toLocaleString('ja-JP')}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

// 率のボタン。選択中は率の色の枠と淡い地。割り勘は 1 段で中央寄せ。
function RateButton({
  index,
  isSelected,
  half = false,
  onSelect
}: {
  index: number;
  isSelected: boolean;
  half?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      aria-pressed={isSelected}
      className={cn(
        'flex items-center gap-2 rounded-xl border-2 text-foreground',
        half ? 'h-13 justify-center px-3.5' : 'h-12 px-3'
      )}
      onClick={onSelect}
      style={{
        borderColor: isSelected ? rateColor(index) : 'transparent',
        backgroundColor: isSelected ? rateTint(index) : 'var(--card)'
      }}
      type='button'
    >
      <span
        aria-hidden='true'
        className='size-3 shrink-0 rounded-full'
        style={{ backgroundColor: rateColor(index) }}
      />
      <span className='font-bold text-[17px]'>{RATE_LABEL_LIST[index]}</span>
      <span className={cn('text-muted-foreground text-xs', !half && 'ml-auto')}>
        {RATE_CAPTION_LIST[index]}
      </span>
    </button>
  );
}
