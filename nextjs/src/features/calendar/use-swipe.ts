'use client';

import { useRef } from 'react';

// 左右スワイプ（フリック）を検知する軽量フック（旧 v-touch の代替・calendar 専用）。
// 旧はカレンダー画面のみ左右スワイプで前月/次月へ移動していた（summary/records には無し）。
// タッチ開始/終了の座標差から横方向の意図的なスワイプのみを拾い、縦スクロールや微小な
// タップは無視する（横移動が縦移動より大きく、かつ閾値以上のときだけ発火）。
//
// 返り値のハンドラをスワイプ対象要素へ spread する（onTouchStart/onTouchEnd）。
// FullCalendar 自体はタッチを日付選択に使うため、カレンダーグリッドの外側の
// コンテナに結線して競合を避ける（呼び出し側の責務）。

type SwipeHandlers = {
  onTouchStart: (event: React.TouchEvent) => void;
  onTouchEnd: (event: React.TouchEvent) => void;
};

type UseSwipeOptions = {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  // 横移動の発火閾値（px）。既定 50。
  threshold?: number;
};

export function useSwipe({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50
}: UseSwipeOptions): SwipeHandlers {
  const start = useRef<{ x: number; y: number } | null>(null);

  return {
    onTouchStart: (event) => {
      const touch = event.changedTouches[0];
      start.current = { x: touch.clientX, y: touch.clientY };
    },
    onTouchEnd: (event) => {
      if (start.current === null) {
        return;
      }
      const touch = event.changedTouches[0];
      const dx = touch.clientX - start.current.x;
      const dy = touch.clientY - start.current.y;
      start.current = null;
      // 縦移動が横移動より大きい＝スクロール意図とみなし無視する。
      if (Math.abs(dx) < Math.abs(dy) || Math.abs(dx) < threshold) {
        return;
      }
      if (dx < 0) {
        onSwipeLeft();
      } else {
        onSwipeRight();
      }
    }
  };
}
