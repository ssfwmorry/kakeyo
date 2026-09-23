'use client';

import { cn } from 'cn';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IconCalendar,
  IconChartBar,
  IconCog,
  IconPiggyBank,
  IconPlusBox
} from '@/components/icons';

// アクティブ判定は現在パスとの完全一致（/summary 配下の records 等で誤点灯させない）。
// 子ルートでの点灯が必要になったら navItems 側に判定を寄せて一般化する。
//
// prefetch: 5 タブは常時ビューポート内にあり遷移先も固定なので、
// 先読みが最も効く条件が揃っている。既定の prefetch は動的ルートについて
// 静的部分しか先読みしないが、(private) 配下は layout が Cookie/DB に触れて
// 動的レンダリングになるため、それでは肝心の往復が隠れない。そこで
// prefetch={true} で動的部分まで含めて Router Cache に載せ、タップ時には
// 手元のペイロードで描画できるようにする。
// 前提として、先読み 1 回あたりのサーバコストは別途削っている
// （JWT のローカル検証 + リマインダーの Suspense 隔離）。これらを入れずに
// 全タブを prefetch すると往復が隠れる代わりに DB/Auth 呼び出しが増える。
//
// position は fixed ではなく (private)/layout.tsx の h-dvh フレックスの最終子。
// fixed だとスクロール領域の最終行に被り、本文側が被り分の padding を自前で持つ
// 必要が出る（実際 main が pb-20 を持っていた）。フレックス子にすれば main の
// flex-1 が自動でナビ分を差し引く。

type NavItem = {
  href: string;
  label: string;
  icon: typeof IconCalendar;
  big?: boolean;
};

const navItems: NavItem[] = [
  { href: '/calendar', label: 'カレンダー', icon: IconCalendar },
  { href: '/summary', label: '集計', icon: IconChartBar },
  { href: '/note', label: '入力', icon: IconPlusBox, big: true },
  { href: '/bank', label: '口座', icon: IconPiggyBank },
  { href: '/setting', label: '設定', icon: IconCog }
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className='shrink-0 border-t bg-background'>
      <ul className='mx-auto flex max-w-screen-sm items-stretch'>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <li key={item.href} className='flex-1'>
              <Link
                href={item.href}
                prefetch={true}
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
