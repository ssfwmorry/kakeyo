import { cn } from 'cn';
import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import { IconPencil } from '@/components/icons';
import { ListCellPending } from './list-cell-pending';

// 白いカードの中に積む 1 行。設定・一覧・リマインダーなど画面をまたいで同じ形で使う。
//
// 区切り線をセル側の border-top ではなく「先頭のブロックを除いた本文側」に引くのは、
// 左端のアイコンやチェックの下を線が横切らないようにするため（デザイン基礎のリストセル）。
// そのため leading（左端の要素）と本文を分け、線は本文側だけに載せる。

type ListCellProps = {
  // 左端に置く要素（色タイル・カテゴリの丸・チェックなど）。省略時は本文が左端から始まる。
  leading?: ReactNode;
  label: ReactNode;
  // label の下に小さく出る補足。
  description?: ReactNode;
  // 右端、シェブロンの手前に出る値（件数・金額など）。
  value?: ReactNode;
  // 右端の要素。既定はシェブロン。並べ替えハンドルなどに差し替える。
  trailing?: ReactNode;
  // リストの先頭かどうか。先頭だけ区切り線を引かない。
  isFirst?: boolean;
  // セルの高さ。デザイン上 48（設定）/ 52（カテゴリ）/ 60〜64（情報量の多い行）を使う。
  height?: 48 | 52 | 60 | 64;
  className?: string;
};

const HEIGHT_CLASS = {
  48: 'h-12',
  52: 'h-13',
  60: 'h-15',
  64: 'h-16'
} as const;

// 行の左の余白と、leading と本文のあいだの間隔（px）。ListCellSortable の区切り線の
// 開始位置を leading の幅から出すのに使う。
const ROW_PADDING_LEFT = 14;
const LEADING_GAP = 12;

export function Chevron() {
  return (
    <svg
      aria-hidden='true'
      className='size-3.5 shrink-0 text-icon-muted'
      fill='none'
      stroke='currentColor'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth='2.4'
      viewBox='0 0 24 24'
    >
      <path d='m9 18 6-6-6-6' />
    </svg>
  );
}

// セルの中身。リンクにもボタンにも同じ見た目を与えるため、外側の要素とは分けている。
function ListCellInner({
  leading,
  label,
  description,
  value,
  trailing,
  isFirst = false
}: Omit<ListCellProps, 'height' | 'className'>) {
  return (
    <>
      {leading}
      {/* 本文側。align-self: stretch させたうえで border-top を引くので、
          線は leading の右から始まる。 */}
      <span
        className={cn(
          'flex flex-grow items-center gap-2 self-stretch',
          !isFirst && 'border-t'
        )}
      >
        <span className='flex min-w-0 flex-grow flex-col gap-px text-left'>
          <span className='truncate text-base'>{label}</span>
          {description !== undefined ? (
            <span className='truncate text-muted-foreground text-xs'>
              {description}
            </span>
          ) : null}
        </span>
        {value !== undefined ? (
          <span className='shrink-0 text-muted-foreground text-[15px]'>
            {value}
          </span>
        ) : null}
        {trailing === undefined ? <Chevron /> : trailing}
      </span>
    </>
  );
}

// 詳細画面へ進む行。外部サイトへ出る行（とりせつ等）は target / rel を渡す。
export function ListCellLink({
  height = 48,
  className,
  href,
  target,
  rel,
  ...inner
}: ListCellProps &
  Pick<ComponentProps<typeof Link>, 'href' | 'target' | 'rel'>) {
  return (
    <Link
      className={cn(
        'relative flex items-center gap-3 px-3.5 text-foreground',
        HEIGHT_CLASS[height],
        className
      )}
      href={href}
      rel={rel}
      target={target}
    >
      <ListCellPending />
      <ListCellInner {...inner} />
    </Link>
  );
}

// 押せない行。パートナーの立替の定期の記録のように、印だけ出すときに使う。
export function ListCellStatic({
  height = 48,
  className,
  ...inner
}: ListCellProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-3.5 text-foreground',
        HEIGHT_CLASS[height],
        className
      )}
    >
      <ListCellInner {...inner} />
    </div>
  );
}

// その場で何かを起こす行（削除・ログアウト・トグルなど）。
export function ListCellButton({
  height = 48,
  className,
  ...inner
}: ListCellProps & Omit<ComponentProps<'button'>, keyof ListCellProps>) {
  const { leading, label, description, value, trailing, isFirst, ...rest } =
    inner;
  return (
    <button
      className={cn(
        'flex w-full items-center gap-3 px-3.5 text-foreground',
        HEIGHT_CLASS[height],
        className
      )}
      type='button'
      {...rest}
    >
      <ListCellInner
        description={description}
        isFirst={isFirst}
        label={label}
        leading={leading}
        trailing={trailing}
        value={value}
      />
    </button>
  );
}

// 本文を押すとシートが開き、右端のハンドルをドラッグして並べ替える行。
//
// 本文とハンドルはどちらもボタンなので、兄弟に並べて入れ子を避ける。区切り線を本文側の
// border で引くとハンドルの下で途切れるため、行の上端に leading の幅ぶん右へ寄せた線を
// 別に引く。右端は既定で ✎ を出し、シェブロンの代わりに「押すと編集」の手がかりにする。
export function ListCellSortable({
  height = 48,
  className,
  handle,
  leadingWidth,
  isFirst = false,
  onClick,
  trailing,
  'aria-label': ariaLabel,
  ...inner
}: ListCellProps & {
  // 右端のドラッグハンドル（SortableHandle）。
  handle: ReactNode;
  // leading の幅（px）。0 なら leading 無しとして行の左端から線を引く。
  leadingWidth: number;
  onClick: () => void;
  'aria-label'?: string;
}) {
  const dividerLeft =
    leadingWidth === 0
      ? ROW_PADDING_LEFT
      : ROW_PADDING_LEFT + leadingWidth + LEADING_GAP;
  return (
    <div
      className={cn(
        'relative flex items-center pr-1.5 pl-3.5 text-foreground',
        HEIGHT_CLASS[height],
        className
      )}
    >
      {isFirst ? null : (
        <span
          aria-hidden='true'
          className='absolute top-0 right-0 border-t'
          style={{ left: dividerLeft }}
        />
      )}
      <button
        aria-label={ariaLabel}
        className='flex min-w-0 flex-grow items-center gap-3 self-stretch text-left text-foreground'
        onClick={onClick}
        type='button'
      >
        <ListCellInner
          {...inner}
          isFirst
          trailing={
            trailing ?? (
              <IconPencil
                aria-hidden='true'
                className='mr-1 size-4 shrink-0 text-primary'
                strokeWidth={2}
              />
            )
          }
        />
      </button>
      {handle}
    </div>
  );
}
