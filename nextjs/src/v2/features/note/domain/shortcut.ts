import type { ShortCutItem } from '@/features/memo-shortcut';
import { RecordType } from '@/lib/shared/types/recordType';

// 「いつもの」に出すショートカットの選別（デザイン NoteType）。
//
// ショートカットは個人の資産だが、中身は個人の記録にも共有の記録にもなりうる
// （record_type で決まる）。入力フローは今のモードのカテゴリ・方法しか候補に持たないので、
// 別モードのショートカットを出すと、押した先で候補に無いカテゴリを指すことになる。
// そのため今のモードで登録できるものだけに絞る。
export function selectShortcutsForMode(
  items: ShortCutItem[],
  isPair: boolean
): ShortCutItem[] {
  return items.filter((item) =>
    isPair
      ? item.recordType !== RecordType.self
      : item.recordType === RecordType.self
  );
}

// ショートカットが立替（自分が払ってあとで精算）か。共有モードの記録でだけ意味を持つ。
export function isInsteadShortcut(item: ShortCutItem): boolean {
  return item.recordType === RecordType.instead;
}
