'use client';

import { useFormAction } from '@/components/form/use-form-action';
import type { ShortCutItem } from '@/features/memo-shortcut';
import { ShortcutList } from '@/features/memo-shortcut';
import { insertRecordFromShortcutAction } from '../actions';

// ショートカット一覧 + ワンタップ記録の統合 Client。
// 表示は memo-shortcut の公開 ShortcutList をそのまま使い、onSelect で選ばれた
// ShortCutItem を calendar 所有の Server Action（insertRecordFromShortcutAction）へ
// FormData で渡して当日記録を作る（record 登録は record ドメインの責務なので shortcut 側では
// なく calendar 側の Action が record サービスを呼ぶ = barrel 非公開の upsertRecord を
// 迂回する正規ルート）。成否トーストは useFormAction が自動発火する。

export function ShortcutRecordList({ items }: { items: ShortCutItem[] }) {
  const [, dispatch] = useFormAction(insertRecordFromShortcutAction);

  const handleSelect = (item: ShortCutItem) => {
    const formData = new FormData();
    // stringbool は 'true'/'false' を明示的に渡す（空文字は parse エラーになるため
    // 省略せず必ず送る）。
    formData.set('isPay', item.isPay ? 'true' : 'false');
    formData.set('methodId', String(item.methodId));
    formData.set('typeId', String(item.typeId));
    if (item.subTypeId !== null) {
      formData.set('subTypeId', String(item.subTypeId));
    }
    formData.set('price', String(item.price));
    if (item.memo) {
      formData.set('memo', item.memo);
    }
    formData.set('recordType', String(item.recordType));
    dispatch(formData);
  };

  return <ShortcutList items={items} onSelect={handleSelect} />;
}
