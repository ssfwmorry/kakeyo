import type { LastUsedMethodIds } from '@/features/record';
import type { Id } from '@/lib/shared/types/id';

// 入力中の組み合わせ（収支 × 個人/共有 × 立替）に対応する「前回の方法」を選ぶ。
// 立替は共有の支出でだけ意味を持つ（個人と収入では常に自分の方法）。

export function pickLastUsedMethodId(
  lastUsed: LastUsedMethodIds,
  {
    isPay,
    isPair,
    isInstead
  }: {
    isPay: boolean;
    isPair: boolean;
    isInstead: boolean;
  }
): Id | null {
  if (!isPair) {
    return isPay ? lastUsed.paySelf : lastUsed.incomeSelf;
  }
  if (!isPay) {
    return lastUsed.incomePair;
  }
  return isInstead ? lastUsed.payPairInstead : lastUsed.payPairShared;
}
