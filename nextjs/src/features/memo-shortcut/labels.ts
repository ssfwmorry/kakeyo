// memo-shortcut feature 固有の UI 文言。

export const memoShortcutLabels = {
  heading: {
    todo: 'TODO',
    shortcut: 'ショートカット'
  },
  action: {
    // 帯末尾の追加 chip の文言（表示時は先頭に ＋ を付ける）。
    addTodo: 'TODO を追加',
    add: '追加',
    // ＋ chip から開いた入力欄を閉じる。
    cancelAdd: '追加をやめる',
    removeTodo: 'この TODO を削除',
    sharePair: 'ペアと共有'
  },
  placeholder: {
    todo: 'やることを入力'
  },
  empty: {
    shortcut: 'ショートカットはありません'
  },
  error: {
    // ペア未設定なのに共有 TODO を追加しようとした。
    pairRequired: 'ペアが未設定のため共有 TODO は追加できません'
  },
  validation: {
    memoRequired: 'やることを入力してください',
    memoMaxLength: 'TODO は30文字以内で入力してください'
  }
} as const;
