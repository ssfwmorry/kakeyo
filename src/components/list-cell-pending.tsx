'use client';

import { useLinkStatus } from 'next/link';

// 押下〜遷移完了のあいだ、行の地を敷く（iOS のテーブルビューと同じ反応）。
// useLinkStatus は Link の子孫でしか使えないので、ListCellLink の中に置く小さな
// クライアント部品に切り出している。
//
// 行の内容の下に敷くため absolute で重ね、レイアウトに影響させない
// （インラインで要素を足すと押すたびに行がずれる）。
export function ListCellPending() {
  const { pending } = useLinkStatus();
  if (!pending) {
    return null;
  }
  return (
    <span
      aria-hidden='true'
      className='pointer-events-none absolute inset-0 bg-fill-soft'
    />
  );
}
