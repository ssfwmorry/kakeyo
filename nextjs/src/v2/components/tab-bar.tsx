'use client';

import { cn } from 'cn';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IconBank,
  IconCalendar,
  IconChartPie,
  IconCog,
  IconPlus
} from '@/components/icons';
import { useNoteModal } from '@/v2/features/note/components/note-modal';

// 浮くピル型のタブバー（原典 Main / Calendar の nav）。画面下端から少し浮かせ、
// すりガラスの地に 5 スロット（カレンダー・集計・＋・口座・設定）を均等に置く。
// 影はデザインが持つ数少ない影の 1 つ（README D17）。
//
// 本文はこのバーの下を通り抜ける。バーは fixed なので、(tabs)/layout.tsx が
// main の下端にバー分の余白を持たせている。fixed をシェル幅（max-w-md）に収めるため、
// 外側に幅だけを持つ透明な枠を置き、その中でバーを描く。
//
// 中央の ＋ はタブではなく「入力を開く」ボタン。ラベルを持たず、アクセントの丸で出す。
// 入力は全画面モーダルで、どのタブからでも開いて閉じると元のタブに戻る。

type TabItem = {
  href: string;
  label: string;
  icon: typeof IconCalendar;
};

const TAB_ITEMS: TabItem[] = [
  { href: '/v2/calendar', label: 'カレンダー', icon: IconCalendar },
  { href: '/v2/summary', label: '集計', icon: IconChartPie },
  { href: '/v2/bank', label: '口座', icon: IconBank },
  { href: '/v2/setting', label: '設定', icon: IconCog }
];

// ＋ の左右に 2 つずつ置くので、中央で分割する。
const LEFT_TABS = TAB_ITEMS.slice(0, 2);
const RIGHT_TABS = TAB_ITEMS.slice(2);

// 設定配下（/v2/setting/type など）でも設定タブを選択中にする。
function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Tab({ item, isActive }: { item: TabItem; isActive: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'flex h-12 flex-1 basis-0 flex-col items-center justify-center gap-0.5 rounded-3xl',
        isActive ? 'bg-line-soft text-primary' : 'text-tab-muted'
      )}
      href={item.href}
      prefetch={true}
    >
      <Icon aria-hidden='true' className='size-6' strokeWidth={2} />
      <span className={cn('text-[10px]', isActive && 'font-semibold')}>
        {item.label}
      </span>
    </Link>
  );
}

export function TabBar() {
  const pathname = usePathname();
  const noteModal = useNoteModal();

  return (
    <div
      className='pointer-events-none fixed inset-x-0 z-40 mx-auto w-full max-w-md px-4'
      style={{ bottom: 'max(26px, env(safe-area-inset-bottom))' }}
    >
      <nav className='pointer-events-auto flex h-16 items-center gap-1 rounded-[32px] border border-black/[0.06] bg-[var(--bar)] p-2 shadow-[0_10px_30px_rgba(22,25,26,0.14),0_2px_6px_rgba(22,25,26,0.06)] backdrop-blur-[20px]'>
        {LEFT_TABS.map((item) => (
          <Tab
            isActive={isActivePath(pathname, item.href)}
            item={item}
            key={item.href}
          />
        ))}
        <div className='flex flex-1 basis-0 justify-center'>
          <button
            aria-label='入力'
            className='flex size-12 items-center justify-center rounded-full bg-primary text-white shadow-[0_4px_12px_rgba(22,25,26,0.22)]'
            onClick={() => noteModal.open()}
            type='button'
          >
            <IconPlus
              aria-hidden='true'
              className='size-[22px]'
              strokeWidth={2.4}
            />
          </button>
        </div>
        {RIGHT_TABS.map((item) => (
          <Tab
            isActive={isActivePath(pathname, item.href)}
            item={item}
            key={item.href}
          />
        ))}
      </nav>
    </div>
  );
}
