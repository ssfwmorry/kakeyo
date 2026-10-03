'use client';

import { type DragEvent, type PointerEvent, useRef } from 'react';

// 横スワイプで前後の期間（月・年）へ送るための共通フック。画面の最外要素に広げて使う
// （シート・ダイアログは portal で外に描画されるので干渉しない）。
//
// 始点と終点だけで判定し、途中の指の動きには追従しない。縦スクロールはブラウザに任せ
// （touch-action: pan-y）、ブラウザがスクロールを引き取ったときの pointercancel で
// 始点を捨てて誤発火を防ぐ。
//
// 横スクロールする子（チップ列など）の上から始まった操作は、その子のスクロールと
// 競合するので無視する。該当要素に data-swipe-ignore を付ける。
//
// リンクや画像の上から始めるとブラウザ標準のドラッグ&ドロップが起きて pointercancel に
// なり発火しないので、dragstart を止める。

// これ未満の横移動はタップや縦スクロールのぶれとみなす。
const MIN_DISTANCE = 50;
// 横移動が縦移動の何倍あれば「横スワイプ」とみなすか。斜めの縦スクロールを拾わないため。
const AXIS_RATIO = 1.5;

const IGNORE_SELECTOR = '[data-swipe-ignore]';

type Point = { x: number; y: number };

export function useHorizontalSwipe({
  onSwipeLeft,
  onSwipeRight
}: {
  // 指を右→左に動かした（次の期間へ送る）。
  onSwipeLeft: () => void;
  // 指を左→右に動かした（前の期間へ戻す）。
  onSwipeRight: () => void;
}) {
  const start = useRef<Point | null>(null);

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (!event.isPrimary) {
      return;
    }
    if ((event.target as Element).closest(IGNORE_SELECTOR) !== null) {
      start.current = null;
      return;
    }
    start.current = { x: event.clientX, y: event.clientY };
  };

  const onPointerUp = (event: PointerEvent<HTMLElement>) => {
    const from = start.current;
    start.current = null;
    if (from === null || !event.isPrimary) {
      return;
    }
    const dx = event.clientX - from.x;
    const dy = event.clientY - from.y;
    if (
      Math.abs(dx) < MIN_DISTANCE ||
      Math.abs(dx) < Math.abs(dy) * AXIS_RATIO
    ) {
      return;
    }
    if (dx < 0) {
      onSwipeLeft();
    } else {
      onSwipeRight();
    }
  };

  const onPointerCancel = () => {
    start.current = null;
  };

  const onDragStart = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
  };

  return {
    onPointerDown,
    onPointerUp,
    onPointerCancel,
    onDragStart,
    style: { touchAction: 'pan-y' } as const
  };
}
