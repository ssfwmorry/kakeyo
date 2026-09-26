'use client';

import { AlertDialog } from '@base-ui/react/alert-dialog';
import { cn } from 'cn';

// 削除など取り返しのつかない操作の確認。画面中央の幅 290 の小さなアラート
// （共通仕様「削除の確認」。Dialog をシートにする規則の例外として原典が描いている形）。
//
// 見出しは「この◯◯を削除しますか？」、本文は対象名を入れた 1〜2 文。フッターは
// 「やめる｜削除」の 2 列で、削除は塗らずに赤い文字だけ。'ok' は 1 列の「OK」で、
// 「削除できません」のような通知に使う。
//
// 呼び出し側が open を持つ制御コンポーネント。トリガーを持たないのは、
// 起動元がヘッダーのゴミ箱・行頭の −・行末のボタンとまちまちで、
// 起動元の見た目をここで決めたくないため。
//

export function ConfirmAlert({
  open,
  onCancel,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel = 'やめる',
  variant = 'destructive',
  pending = false
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  // 'ok' は 1 列。confirmLabel の既定は「OK」になり、onConfirm で閉じる。
  variant?: 'destructive' | 'ok';
  pending?: boolean;
}) {
  const isOk = variant === 'ok';
  const confirmText = confirmLabel ?? (isOk ? 'OK' : '削除');
  return (
    <AlertDialog.Root
      onOpenChange={(next) => {
        if (!next) {
          onCancel();
        }
      }}
      open={open}
    >
      <AlertDialog.Portal>
        <AlertDialog.Backdrop
          className='fixed inset-0 z-[60] bg-[rgba(12,16,17,0.35)] transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0'
          // シートの上に重ねて出すとき（入れ子）も暗幕を出す。デザインは確認の背面をさらに暗くしている。
          forceRender
        />
        <AlertDialog.Viewport className='fixed inset-0 z-[60] flex items-center justify-center'>
          <AlertDialog.Popup className='w-[290px] overflow-hidden rounded-2xl bg-card text-foreground outline-none transition-[opacity,transform] duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0'>
            <div className='flex flex-col gap-2 px-4.5 pt-5 pb-4 text-center'>
              <AlertDialog.Title className='font-bold text-[17px]'>
                {title}
              </AlertDialog.Title>
              {description !== undefined ? (
                <AlertDialog.Description className='text-[13px] text-muted-foreground leading-relaxed'>
                  {description}
                </AlertDialog.Description>
              ) : null}
            </div>
            <div
              className={cn(
                'grid border-t',
                isOk ? 'grid-cols-1' : 'grid-cols-2'
              )}
            >
              {isOk ? null : (
                <button
                  className='h-12 border-r text-base text-foreground'
                  onClick={onCancel}
                  type='button'
                >
                  {cancelLabel}
                </button>
              )}
              <button
                className={cn(
                  'h-12 font-bold text-base disabled:opacity-50',
                  isOk ? 'text-primary' : 'text-destructive'
                )}
                disabled={pending}
                onClick={onConfirm}
                type='button'
              >
                {confirmText}
              </button>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Viewport>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
