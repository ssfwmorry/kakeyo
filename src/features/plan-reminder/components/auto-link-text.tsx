import { Fragment, type ReactNode } from 'react';
import { toLinkSegments } from '../domain/auto-link';

// メモ内の URL を自動リンク化する。XSS を避けるため dangerouslySetInnerHTML を使わず、
// toLinkSegments の分割結果を <a> / テキストへ写す。
// 改行は保持したいので whitespace-pre-wrap を親側で当てる前提。

export function AutoLinkText({ text }: { text: string }): ReactNode {
  const segments = toLinkSegments(text);
  return segments.map((segment, index) => {
    // 同一 URL/文字列が複数回現れても位置が違えば別要素なので index をキーに含める。
    const key = `${index}-${segment.text}`;
    if (segment.isUrl) {
      return (
        <a
          key={key}
          href={segment.text}
          target='_blank'
          rel='noopener noreferrer'
          className='text-blue-600 underline'
        >
          {segment.text}
        </a>
      );
    }
    return <Fragment key={key}>{segment.text}</Fragment>;
  });
}
