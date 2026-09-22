'use client';

import { cn } from 'cn';
import {
  BarChart3,
  Calendar,
  PiggyBank,
  PlusSquare,
  Settings
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// アクティブ判定は現在パスとの完全一致（/summary 配下の records 等で誤点灯させない）。
// 子ルートでの点灯が必要になったら navItems 側に判定を寄せて一般化する。

type NavItem = {
  href: string;
  label: string;
  icon: typeof Calendar;
  big?: boolean;
};

const navItems: NavItem[] = [
  { href: '/calendar', label: 'カレンダー', icon: Calendar },
  { href: '/summary', label: '集計', icon: BarChart3 },
  { href: '/note', label: '入力', icon: PlusSquare, big: true },
  { href: '/bank', label: '口座', icon: PiggyBank },
  { href: '/setting', label: '設定', icon: Settings }
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className='fixed inset-x-0 bottom-0 z-40 border-t bg-background'>
      <ul className='mx-auto flex max-w-screen-sm items-stretch'>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <li key={item.href} className='flex-1'>
              <Link
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 py-2 text-muted-foreground transition-colors',
                  isActive && 'text-primary'
                )}
              >
                <Icon className={cn('size-5', item.big && 'size-7')} />
                <span className='text-xs'>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
