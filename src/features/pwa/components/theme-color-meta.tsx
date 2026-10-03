'use client';

import { useTheme } from 'next-themes';
import { useEffect } from 'react';
import { THEME_COLOR } from '@/features/pwa/theme-color';

// ステータスバーの色をアプリ内のテーマ切替に追従させる。
//
// root layout が置く meta は media 属性で OS の設定しか見ないため、ヘッダーのボタンで
// OS と違う側を選ぶと（OS ライト＋アプリ内ダーク等）ステータスバーだけ取り残される。
//
// ブラウザは meta[name=theme-color] を「tree order で最初に media が一致したもの」で
// 決める（後勝ちではない）。media 無しは常に一致するため、head の先頭に挿し込まないと
// 既存の media 付き 2 本に先を越されて無視される。media 付きは消さずに残す。消すと
// この JS が動く前の初期描画で色が無くなる。
export function ThemeColorMeta() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    // マウント直後の 1 フレームは undefined。media 付きの指定に任せる。
    if (resolvedTheme !== 'light' && resolvedTheme !== 'dark') {
      return;
    }

    const meta =
      document.querySelector<HTMLMetaElement>(
        'meta[name="theme-color"][data-runtime]'
      ) ?? createRuntimeMeta();

    meta.content = THEME_COLOR[resolvedTheme];
  }, [resolvedTheme]);

  return null;
}

function createRuntimeMeta(): HTMLMetaElement {
  const meta = document.createElement('meta');
  meta.name = 'theme-color';
  meta.dataset.runtime = '';
  document.head.prepend(meta);
  return meta;
}
