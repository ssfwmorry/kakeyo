import { createElement } from 'react';
import { toast } from 'sonner';
import type { ToastMessage } from '@/lib/shared/types/formResult';

// トースト（docs/new-design/共通仕様.md「トースト」）。
//
// 見た目は AppToaster（components/toaster.tsx）が種類ごとに持つ。ここは
// 「どの種類で・どれだけ出すか」だけを決める:
// - 完了は約 3 秒で消える。エラーは理由を読ませるため自動では消えず、× か
//   次のトーストで消える。
// - 同時に出すのは 1 枚。id を固定して、新しいものが古いものを置き換える。
//
// 種類は 2 つに丸める。info は完了と同じ黒、warning はエラーと同じ赤。

export const TOAST_ID = 'app';
export const SUCCESS_DURATION = 3000;

export function showToast({ type, message }: ToastMessage): void {
  const isError = type === 'error' || type === 'warning';
  // sonner の live region は polite 固定なので、エラーは文言側に alert を付けて
  // 読み上げを割り込ませる。
  const title = createElement(
    'span',
    { role: isError ? 'alert' : 'status' },
    message
  );
  const show = isError ? toast.error : toast.success;
  show(title, {
    id: TOAST_ID,
    duration: isError ? Number.POSITIVE_INFINITY : SUCCESS_DURATION
  });
}

export function dismissToast(): void {
  toast.dismiss(TOAST_ID);
}
