'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { IconMoon, IconSun } from '@/components/icons';

// ライト／ダークの手動切替。初期値は端末の設定（next-themes の system）に従い、
// ここで上書きしたときだけ端末に保存される。
//
// アイコンは「押すとこうなる」側を出す（ライト中は月、ダーク中は太陽）。デザイン基礎の指定。
//
// マウント前は resolvedTheme が未確定で、サーバが描いた HTML と食い違って
// hydration error になる。確定するまでは同じ大きさの空枠を出して場所だけ押さえる。

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className='size-10' />;
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      aria-label={isDark ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
      className='flex size-10 items-center justify-center rounded-full text-foreground'
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      type='button'
    >
      {isDark ? (
        <IconSun aria-hidden='true' className='size-[21px]' />
      ) : (
        <IconMoon aria-hidden='true' className='size-[21px]' />
      )}
    </button>
  );
}
