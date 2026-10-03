import { cn } from 'cn';

// 処理中を示す小さな輪。押したボタンの中に出し、全画面のオーバーレイは使わない。
// 色は文字色に従う（border-current）ので、置く場所の文字色でそのまま馴染む。

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden='true'
      className={cn(
        'inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent',
        className
      )}
    />
  );
}
