'use client';

import { useMemo, useState, useTransition } from 'react';
import { useFormToast } from '@/components/form/use-form-toast';
import { IconMinus } from '@/components/icons';
import type { FormActionResult } from '@/lib/shared/types/formResult';
import { ConfirmAlert } from '@/v2/components/ui/confirm-alert';
import { quoted } from '@/v2/lib/format';

// 削除の一連の流れ: 確認（中央のアラート）→ 実行 → 成功なら片付け／紐づくデータが
// あって消せなければ説明。マスタのシート（右上のゴミ箱）と一覧の編集モード（行頭の −）と
// カテゴリ編集画面（末尾のボタン）が同じ流れを使うので、状態と見た目をここに寄せる。
//
// 削除できなかったときの出し方は 2 つ。方法・口座・カテゴリは「削除できません」の
// アラートで理由を説明し、予定カテゴリは原典どおりトースト（README D19）。
// 指定が無ければ Action が返した文言をそのままトーストに出す。

export type DeleteAction = (
  prev: FormActionResult | null,
  formData: FormData
) => Promise<FormActionResult>;

export type DeleteTarget = { id: number; name: string };

export type ForeignKeyHandling =
  | {
      kind: 'alert';
      // 「「{名前}」には記録があります。名前と色の変更はできます。」
      description: (name: string) => string;
    }
  | {
      kind: 'toast';
      // 「「{名前}」を使っている予定があるので削除できません」
      message: (name: string) => string;
    };

export type DeleteFlow = ReturnType<typeof useDeleteFlow>;

export function useDeleteFlow({
  deleteAction,
  onForeignKey,
  onDeleted,
  isKnownBlocked
}: {
  // 省略すると ask しても何も起きない（削除の入口を出さない画面向け）。
  deleteAction?: DeleteAction;
  onForeignKey?: ForeignKeyHandling;
  onDeleted?: (target: DeleteTarget) => void;
  // 紐づくデータがあって消せないことが一覧の時点で分かっているとき。確認の後、
  // Action を呼ばずに onForeignKey の出し方で説明する（デモは削除が no-op 成功になるため、
  // サーバの分類だけに頼ると案内が出ない）。
  isKnownBlocked?: (target: DeleteTarget) => boolean;
}) {
  const [target, setTarget] = useState<DeleteTarget | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<FormActionResult | null>(null);

  // 紐づきエラーをアラートで出すときはトーストを鳴らさない。トーストで出すときは
  // 対象名入りの文言に差し替える。
  const toastResult = useMemo(() => {
    if (result?.error !== 'foreignKey' || onForeignKey === undefined) {
      return result;
    }
    if (onForeignKey.kind === 'alert') {
      return null;
    }
    return {
      toast: {
        type: 'error' as const,
        message: onForeignKey.message(target?.name ?? '')
      }
    };
  }, [result, onForeignKey, target]);
  useFormToast(toastResult);

  // 前回の結果を捨ててから確認を開く。残したままだと対象が変わったときに
  // 前回のトーストがもう一度鳴る。
  const ask = (next: DeleteTarget) => {
    setResult(null);
    setTarget(next);
    setIsConfirming(true);
  };

  const run = () => {
    if (deleteAction === undefined || target === null) {
      return;
    }
    setIsConfirming(false);
    if (isKnownBlocked?.(target)) {
      setResult({ error: 'foreignKey' });
      if (onForeignKey?.kind === 'alert') {
        setIsBlocked(true);
      }
      return;
    }
    startTransition(async () => {
      const formData = new FormData();
      formData.set('id', String(target.id));
      const next = await deleteAction(null, formData);
      setResult(next);
      if (next.toast?.type === 'success') {
        onDeleted?.(target);
      } else if (
        next.error === 'foreignKey' &&
        onForeignKey?.kind === 'alert'
      ) {
        setIsBlocked(true);
      }
    });
  };

  return {
    target,
    isConfirming,
    isBlocked,
    isPending,
    ask,
    cancel: () => setIsConfirming(false),
    dismissBlocked: () => setIsBlocked(false),
    run
  };
}

// 削除の確認と、紐づきがあって消せないときの説明。useDeleteFlow と対で置く。
export function DeleteAlerts({
  entity,
  remove,
  onForeignKey,
  description
}: {
  // 「カテゴリ」「支払方法」「口座」。見出し「この◯◯を削除しますか？」に使う。
  entity: string;
  remove: DeleteFlow;
  onForeignKey?: ForeignKeyHandling;
  // 確認の本文。省略時は「「{名前}」を削除します。削除すると元に戻せません。」
  description?: (name: string) => string;
}) {
  const name = remove.target?.name ?? '';
  return (
    <>
      <ConfirmAlert
        description={
          description === undefined
            ? `${quoted(name)}を削除します。削除すると元に戻せません。`
            : description(name)
        }
        onCancel={remove.cancel}
        onConfirm={remove.run}
        open={remove.isConfirming}
        pending={remove.isPending}
        title={`この${entity}を削除しますか？`}
      />
      {onForeignKey?.kind === 'alert' ? (
        <ConfirmAlert
          description={onForeignKey.description(name)}
          onCancel={remove.dismissBlocked}
          onConfirm={remove.dismissBlocked}
          open={remove.isBlocked}
          title={`この${entity}は削除できません`}
          variant='ok'
        />
      ) : null}
    </>
  );
}

// 編集モードの行頭に出す赤い −（原典 SetType / SetMethod）。押すと削除の確認へ進む。
export function RemoveBadge({
  onClick,
  disabled = false
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      aria-label='削除'
      className='flex size-5.5 shrink-0 items-center justify-center rounded-full bg-destructive text-white disabled:opacity-50'
      disabled={disabled}
      onClick={onClick}
      type='button'
    >
      <IconMinus aria-hidden='true' className='size-3' strokeWidth={3} />
    </button>
  );
}
