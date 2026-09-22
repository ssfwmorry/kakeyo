'use client';

import { cn } from 'cn';
import { Pencil, Repeat } from 'lucide-react';
import { ShareBadge } from '@/components/share-badge';
import { colorHex } from '@/features/master';
import { L } from '@/lib/shared/labels';
import { resolveRecordEditable } from '../domain/record-fields';
import { SETTLEMENT_DISPLAY } from '../labels';

// record 一覧カード。records 明細画面（SummarizedRecordItem）と
// calendar 日別一覧（RecordListItem）で共用する。
// 型は両一覧が満たす共通フィールドで受ける（isSettlement は SummarizedRecordItem に無いため
// optional）。編集導線は呼び出し側が onEdit で与える（未指定なら編集ボタンを出さない）。

export type RecordCardItem = {
  isSelf: boolean;
  isPay: boolean | null;
  price: number;
  memo: string | null;
  plannedRecordId: number | null;
  methodName: string;
  methodColorClassificationName: string;
  typeName: string | null;
  subTypeName: string | null;
  typeColorClassificationName: string | null;
  isPair: boolean;
  pairUserName: string | null;
  isInstead: boolean | null;
  isSettlement?: boolean | null;
};

type RecordCardProps = {
  record: RecordCardItem;
  // 編集導線。渡され、かつ isEnableEdit が true のときのみ編集ボタンを出す。
  onEdit?: () => void;
};

// 種別 ー サブ を連結（種別未設定は '精算' 補完）。区切りは全角長音 ' ー '。
function typeAndSubType(record: RecordCardItem): string {
  const type = record.typeName ?? '精算';
  return record.subTypeName ? `${type} ー ${record.subTypeName}` : type;
}

export function RecordCard({ record, onEdit }: RecordCardProps) {
  const isEnableEdit = resolveRecordEditable(record);
  const isShowPlannedIcon = record.plannedRecordId !== null;
  // 収入（isPay=false）は青字。
  const isIncome = record.isPay === false;
  const methodColor = colorHex(record.methodColorClassificationName);

  return (
    <div
      className={cn(
        'flex flex-col gap-1 rounded-md border p-2',
        // 相手（自分以外）の record は淡色で区別する（自分視点の一覧）。
        !record.isSelf && 'opacity-60'
      )}
    >
      {/* 上段: 種別色マーカー(共有内包) ＋ 種別ーサブ ＋ 定期アイコン、右に編集 */}
      <div className='flex items-center justify-between gap-2'>
        <div className='flex items-center gap-2'>
          <ShareBadge
            colorHex={colorHex(
              record.typeColorClassificationName ?? SETTLEMENT_DISPLAY.color
            )}
            isPair={record.isPair}
            className='size-7'
          />
          <span className='flex items-center gap-1 text-sm'>
            {typeAndSubType(record)}
            {isShowPlannedIcon ? (
              <Repeat
                className='size-3.5 text-muted-foreground'
                aria-label='定期'
              />
            ) : null}
          </span>
        </div>
        {onEdit && isEnableEdit ? (
          <button
            type='button'
            aria-label={L.button.edit}
            className='shrink-0 text-muted-foreground hover:text-foreground'
            onClick={onEdit}
          >
            <Pencil className='size-4' />
          </button>
        ) : null}
      </div>

      {/* 下段: 方法(色/共有)・相手名 | メモ | 金額 */}
      <div className='flex items-stretch gap-2 text-sm'>
        <div className='flex w-1/3 flex-col justify-center'>
          {record.pairUserName ? (
            <span className='text-muted-foreground text-xs'>
              {record.pairUserName}
            </span>
          ) : null}
          {/* 方法単位の共有アイコンは一覧型に isPairMethod 相当が無いため省略
              （record 単位の共有は上段マーカーで表示）。 */}
          <span style={{ color: methodColor }}>{record.methodName}</span>
        </div>
        <div className='flex w-1/3 items-center border-l pl-2 text-muted-foreground'>
          {record.memo ?? ''}
        </div>
        <div className='flex w-1/3 items-baseline justify-end gap-0.5'>
          <span
            className={cn(
              'font-medium text-lg tabular-nums',
              isIncome && 'text-blue-600'
            )}
          >
            {record.price.toLocaleString()}
          </span>
          <span className='text-xs'>円</span>
        </div>
      </div>
    </div>
  );
}
