'use client';

import { cn } from 'cn';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IconCalendar,
  IconChartPie,
  IconCog,
  IconPiggyBank,
  IconPlus
} from '@/components/icons';

// すりガラスのタブバー。中央の ＋ だけはタブではなく「入力を全画面で開く」ボタンなので、
// ラベルを持たずアクセントの角丸ボタンで出す（デザイン基礎）。
//
// 下端の余白はホームバー分を env(safe-area-inset-bottom) で逃がす。値が 0 の端末でも
// デザイン上の 34px 相当が要るので、max() で下限を確保している。
//
// 既存の BottomNav と違い position: fixed ではなくシェルのフレックス最終子。
// 背面がすりガラスなので、本文はこのバーの下を通り抜けてよい ＝ シェル側で
// main を overflow-y-auto にしたうえで、本文末尾にバー分の余白を持たせる。

type TabItem = {
  href: string;
  label: string;
  icon: typeof IconCalendar;
};

const TAB_ITEMS: TabItem[] = [
  { href: '/v2/calendar', label: 'カレンダー', icon: IconCalendar },
  { href: '/v2/summary', label: '集計', icon: IconChartPie },
  { href: '/v2/bank', label: '口座', icon: IconPiggyBank },
  { href: '/v2/setting', label: '設定', icon: IconCog }
];

// ＋ の左右に 2 つずつ置くので、中央で分割する。
const LEFT_TABS = TAB_ITEMS.slice(0, 2);
const RIGHT_TABS = TAB_ITEMS.slice(2);

function Tab({ item, isActive }: { item: TabItem; isActive: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'flex flex-1 flex-col items-center gap-0.5 text-muted-foreground',
        isActive && 'font-semibold text-primary'
      )}
      href={item.href}
      prefetch={true}
    >
      <Icon aria-hidden='true' className='size-6' />
      <span className='text-[10px]'>{item.label}</span>
    </Link>
  );
}

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      className='shrink-0 border-t bg-[var(--bar)] pt-1.5 backdrop-blur-xl'
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom), 34px)'
      }}
    >
      <div className='flex items-start px-1'>
        {LEFT_TABS.map((item) => (
          <Tab isActive={pathname === item.href} item={item} key={item.href} />
        ))}
        <div className='flex flex-1 justify-center'>
          <Link
            aria-label='入力'
            className='flex h-9.5 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground'
            href='/v2/note'
          >
            <IconPlus
              aria-hidden='true'
              className='size-5.5'
              strokeWidth={2.4}
            />
          </Link>
        </div>
        {RIGHT_TABS.map((item) => (
          <Tab isActive={pathname === item.href} item={item} key={item.href} />
        ))}
      </div>
    </nav>
  );
}
