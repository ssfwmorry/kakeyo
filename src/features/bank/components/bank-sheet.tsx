'use client';

import { MasterSheet } from '@/components/master-sheet';
import type { BankItem } from '@/features/bank';
import { deleteBankAction, upsertBankAction } from '@/features/bank/actions';
import { bankFormSchema } from '@/features/bank/schemas/bank-schema';
import type { ColorClassification } from '@/features/master';
import { quoted } from '@/lib/shared/domain/format';

// 口座の追加・編集シート（原典 SetBank のシート）。名前と色だけのマスタなので
// 方法・予定カテゴリと同じ MasterSheet に載せる。
//
// 残高の記録がある口座は消せない（FK）。有無は一覧が hasBalance で知っているので、
// サーバの分類を待たずに「削除できません」の説明を出す（デモは削除が no-op 成功になるため、
// サーバの分類だけに頼ると案内が出ない）。

export function BankSheet({
  isOpen,
  onOpenChange,
  bank,
  colors
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  // 編集対象。追加のときは undefined。
  bank?: BankItem;
  colors: ColorClassification[];
}) {
  return (
    <MasterSheet
      colors={colors}
      deleteAction={deleteBankAction}
      editing={bank}
      entity='口座'
      helper={{
        create: '追加すると、残高の登録に行が増えます',
        edit: '名前や色を変えると、これまでの残高の記録にも反映されます'
      }}
      isDeleteBlocked={bank?.hasBalance ?? false}
      isOpen={isOpen}
      maxLength={30}
      nameAriaLabel='口座名'
      nameLabel='口座名'
      namePlaceholder='例：楽天銀行'
      onForeignKey={{
        kind: 'alert',
        description: (name) =>
          `${quoted(name)}には残高の記録があります。名前と色の変更はできます。`
      }}
      onOpenChange={onOpenChange}
      upsertAction={upsertBankAction}
      upsertSchema={bankFormSchema}
    />
  );
}
