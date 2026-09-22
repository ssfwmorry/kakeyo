// memo-shortcut feature 固有の UI 文言。

export const memoShortcutLabels = {
  heading: {
    todo: 'TODO',
    shortcut: 'ショートカット'
  },
  action: {
    addTodo: 'TODO を追加',
    add: '追加',
    removeTodo: 'この TODO を削除',
    sharePair: 'ペアと共有'
  },
  placeholder: {
    todo: 'やることを入力'
  },
  empty: {
    todo: 'TODO はありません',
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
