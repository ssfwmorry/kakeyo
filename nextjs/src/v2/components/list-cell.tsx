import { cn } from 'cn';
import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

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

function Chevron() {
  return (
    <svg
      aria-hidden='true'
      className='size-3.5 shrink-0 text-muted-foreground'
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
        'flex items-center gap-3 px-3.5 text-foreground',
        HEIGHT_CLASS[height],
        className
      )}
      href={href}
      rel={rel}
      target={target}
    >
      <ListCellInner {...inner} />
    </Link>
  );
}

// 行そのものは押せず、中に置いたボタンだけが操作対象になる行。
// 並べ替え中のカテゴリ・方法のように、「行の中に操作がある」ときに使う
// （行をボタンやリンクにすると、その中のボタンが入れ子になってしまう）。
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
