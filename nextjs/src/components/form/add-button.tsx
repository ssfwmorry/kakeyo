'use client';

import { IconPlus } from '@/components/icons';
import { Button } from '@/components/ui/button';

// 一覧の末尾に置く「追加」ボタン（設定画面の各タブ共通）。
//
// 一覧の下端・右寄せが追加の定位置。アイコンだけで文字を持たないため、何を追加するのか
// は label（読み上げ専用）でしか伝わらない。必須 prop にして付け忘れを防ぐ。

export function AddButton({
  label,
  onClick,
  disabled = false,
  size,
  variant
}: {
  // 読み上げ用の名前（「カテゴリを追加」など）。可視ラベルを持たないため必須。
  label: string;
  onClick: () => void;
  disabled?: boolean;
  size?: React.ComponentProps<typeof Button>['size'];
  variant?: React.ComponentProps<typeof Button>['variant'];
}) {
  return (
    <div className='flex justify-end'>
      <Button
        type='button'
        size={size}
        variant={variant}
        disabled={disabled}
        aria-label={label}
        onClick={onClick}
      >
        <IconPlus aria-hidden />
      </Button>
    </div>
  );
}
