// memo-shortcut feature の公開 API（barrel）。
// server-only（services / repositories）は re-export しない。
// 公開するのは TODO / ショートカットの
// Client Component と FE 型のみ。actions は Client Component が直接 import する。
//
// 【calendar 統合レーンへの公開 API】
// - MemoList         : TODO 一覧 + 追加 + 削除 UI（items / hasPair を props で渡す）。
//                      追加/削除は内部の insertMemoAction / deleteMemoAction が実行し
//                      revalidatePath('/calendar') で再取得する。
// - ShortcutList     : ショートカット一覧 UI（items / 任意 onSelect を props で渡す）。
//                      ショートカットからの記録（upsertRecord）は record ドメインの
//                      責務。onSelect で選択された ShortCutItem を受け取り、統合側で
//                      record 登録すること（shortcut は record を所有しない）。
// - 型: MemoItem / ShortCutItem
// - データ取得は getMemoList / getShortCutList を
//   @/features/memo-shortcut/server/services から直接 import する
//   （Server Component 内。session は requireAuth() で取得して渡す）。
//   hasPair は session.pairId !== null で判定して MemoList に渡す。

export { MemoList } from './components/memo-list';
export { ShortcutList } from './components/shortcut-list';
export type { MemoItem, ShortCutItem } from './types';
