import type { ReactNode } from 'react';
import {
  IconBank,
  IconBell,
  IconCalendar,
  IconCreditCard,
  IconLogout,
  IconMail,
  IconManual,
  IconTag,
  IconUpdate
} from '@/components/icons';
import { TUTORIAL_URL } from '@/features/auth/labels';
import { ListCellLink } from '@/v2/components/list-cell';
import { NotificationBell } from '@/v2/components/notification-bell';
import { PairModeSegment } from '@/v2/components/pair-mode-segment';
import { ScreenTitle } from '@/v2/components/screen-title';
import { SectionList } from '@/v2/components/section-list';
import { ThemeToggle } from '@/v2/components/theme-toggle';
import { LogoutCell } from './logout-cell';

// 設定トップ（新デザイン）。
//
// 旧画面は 3 タブ（家計管理 / 予定管理 / その他）に縦長のフォームを直接並べていたが、
// 新デザインではタブをやめ、グループ化したリストから各詳細画面へ進む形にする
// （デザイン基礎「設定はグループ化したリスト → 詳細画面へ進む」）。
// そのため、この画面自身はフォームを持たず件数だけを出す。
//
// 行のアイコンは色タイル（30px・角丸 8）に白抜き。タイルの色はカテゴリ色ではなく
// 行の意味づけなので、--cat-* ではなく専用の --tile-* を使う。

type SettingRow = {
  href: string;
  label: string;
  icon: typeof IconTag;
  // アイコンタイルの背景色。
  tile: string;
  // 右端に出す件数。null なら出さない。
  count: number | null;
  // 外部サイトへ出る行。別タブで開く。
  external?: boolean;
};

export function SettingScreen({
  isPair,
  hasPair,
  typeCount,
  methodCount,
  bankCount,
  plannedRecordCount,
  planTypeCount,
  reminderCount
}: {
  isPair: boolean;
  hasPair: boolean;
  typeCount: number;
  methodCount: number;
  // 口座は個人モード専用。共有モードでは行ごと出さないので null。
  bankCount: number | null;
  plannedRecordCount: number;
  planTypeCount: number;
  reminderCount: number;
}) {
  const kakeiRows: SettingRow[] = [
    {
      href: '/setting/type',
      label: 'カテゴリ',
      icon: IconTag,
      tile: 'var(--primary)',
      count: typeCount
    },
    {
      href: '/setting/method',
      label: '方法',
      icon: IconCreditCard,
      tile: 'var(--tile-blue)',
      count: methodCount
    },
    // 口座は個人の資産なので共有モードでは出さない（旧画面と同じ扱い）。
    ...(bankCount === null
      ? []
      : [
          {
            href: '/setting/bank',
            label: '口座',
            icon: IconBank,
            tile: 'var(--tile-green)',
            count: bankCount
          }
        ]),
    {
      href: '/setting/planned-record',
      label: '定期の記録',
      icon: IconUpdate,
      tile: 'var(--tile-purple)',
      count: plannedRecordCount
    }
  ];

  const planRows: SettingRow[] = [
    {
      href: '/setting/plan-type',
      label: '予定カテゴリ',
      icon: IconCalendar,
      tile: 'var(--tile-orange)',
      count: planTypeCount
    },
    {
      href: '/setting/reminder',
      label: 'リマインダー',
      icon: IconBell,
      tile: 'var(--tile-red)',
      count: reminderCount
    }
  ];

  return (
    <div className='flex flex-col gap-2 px-4'>
      {/* 画面上部の固定配置。左にベル、右にダーク切替と個人｜共有（全画面共通の位置）。 */}
      <div className='flex h-11 items-center justify-between'>
        <NotificationBell />
        <div className='flex items-center gap-1.5'>
          <ThemeToggle />
          <PairModeSegment hasPair={hasPair} isPair={isPair} />
        </div>
      </div>

      <ScreenTitle>設定</ScreenTitle>

      <div className='mt-1 flex flex-col gap-3.5'>
        <SectionList title='家計管理'>
          {kakeiRows.map((row, index) => (
            <SettingCell isFirst={index === 0} key={row.href} row={row} />
          ))}
        </SectionList>

        <SectionList title='予定管理'>
          {planRows.map((row, index) => (
            <SettingCell isFirst={index === 0} key={row.href} row={row} />
          ))}
        </SectionList>

        {/* 「アカウント」行はデザインにはあるが、退会フローが未確定で行き先の画面が
            旧画面にも無い（旧 GeneralTab のコメント参照）。退会フローが決まるまで出さない。 */}
        <SectionList title='その他'>
          {/* とりせつは画面ではなく Notion の外部ページ（ログイン画面と同じ先）。 */}
          <SettingCell
            isFirst
            row={{
              href: TUTORIAL_URL,
              label: 'とりせつ',
              icon: IconManual,
              tile: 'var(--muted-foreground)',
              count: null,
              external: true
            }}
          />
          {/* お問い合わせは公開ページ（/inquiry）が旧デザインのまま残っている。
              静的な案内文だけの画面なので v2 版は作らず、そのまま送る。 */}
          <SettingCell
            row={{
              href: '/inquiry',
              label: 'お問い合わせ',
              icon: IconMail,
              tile: 'var(--muted-foreground)',
              count: null
            }}
          />
          {/* ログアウトは破壊的ではないが引き返しにくい操作なので、
              文字色を destructive にしてグループの末尾に置く。 */}
          <LogoutCell
            leading={
              <IconTile
                color='var(--destructive)'
                icon={<IconLogout className='size-[17px]' />}
              />
            }
          />
        </SectionList>
      </div>
    </div>
  );
}

function SettingCell({
  row,
  isFirst = false,
  className
}: {
  row: SettingRow;
  isFirst?: boolean;
  className?: string;
}) {
  const Icon = row.icon;
  return (
    <ListCellLink
      className={className}
      href={row.href}
      isFirst={isFirst}
      label={row.label}
      leading={
        <IconTile color={row.tile} icon={<Icon className='size-[17px]' />} />
      }
      rel={row.external ? 'noopener noreferrer' : undefined}
      target={row.external ? '_blank' : undefined}
      value={row.count === null ? undefined : String(row.count)}
    />
  );
}

// 行の頭の色タイル。中のアイコンは常に白抜き（タイル側で十分な濃さを持たせている）。
function IconTile({ color, icon }: { color: string; icon: ReactNode }) {
  return (
    <span
      aria-hidden='true'
      className='flex size-7.5 shrink-0 items-center justify-center rounded-lg text-white'
      style={{ backgroundColor: color }}
    >
      {icon}
    </span>
  );
}
