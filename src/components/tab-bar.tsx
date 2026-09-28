'use client';

import { cn } from 'cn';
import Link, { useLinkStatus } from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IconBank,
  IconCalendar,
  IconChartPie,
  IconCog,
  IconPlus
} from '@/components/icons';
import { useNoteModal } from '@/features/record/components/note-modal';

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
  { href: '/calendar', label: 'カレンダー', icon: IconCalendar },
  { href: '/summary', label: '集計', icon: IconChartPie },
  { href: '/bank', label: '口座', icon: IconBank },
  { href: '/setting', label: '設定', icon: IconCog }
];

// ＋ の左右に 2 つずつ置くので、中央で分割する。
const LEFT_TABS = TAB_ITEMS.slice(0, 2);
const RIGHT_TABS = TAB_ITEMS.slice(2);

// 設定配下（/setting/type など）でも設定タブを選択中にする。
function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

// 押したタブを、遷移の完了を待たずに選択中の見た目へ寄せる。スピナーは足さない
// （「押したタブがもう選ばれている」と分かれば十分で、回るアイコンより静か）。
// useLinkStatus は Link の子孫でしか使えないため、中身をこの部品に切り出している。
function TabContent({ item, isActive }: { item: TabItem; isActive: boolean }) {
  const { pending } = useLinkStatus();
  const Icon = item.icon;
  const isSelected = isActive || pending;

  return (
    <span
      className={cn(
        'flex h-12 w-full flex-col items-center justify-center gap-0.5 rounded-3xl transition-colors motion-reduce:transition-none',
        isSelected ? 'bg-line-soft text-primary' : 'text-tab-muted'
      )}
    >
      <Icon aria-hidden='true' className='size-6' strokeWidth={2} />
      <span className={cn('text-[10px]', isSelected && 'font-semibold')}>
        {item.label}
      </span>
    </span>
  );
}

function Tab({ item, isActive }: { item: TabItem; isActive: boolean }) {
  return (
    <Link
      aria-current={isActive ? 'page' : undefined}
      className='flex h-12 flex-1 basis-0 items-center justify-center rounded-3xl'
      href={item.href}
      prefetch={true}
    >
      <TabContent isActive={isActive} item={item} />
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
