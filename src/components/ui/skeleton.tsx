import { cn } from 'cn';

// 「まだ意味を持たない面」。骨格は実寸で置き、解決後の中身と位置がずれないようにする。
// 脈打たせない（共通仕様の抑制に合わせる）。出現は globals.css の skeleton-in。
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden='true'
      className={cn('animate-skeleton-in rounded bg-fill-soft', className)}
    />
  );
}

// 骨格の繰り返しに渡す key。中身を持たない飾りなので並べ替えも差し替えも起きないが、
// 配列 index を key にしないための固定キーを作る。
export function skeletonKeys(count: number): string[] {
  return Array.from({ length: count }, (_, index) => `skeleton-${index}`);
}
