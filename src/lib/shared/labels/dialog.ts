// フォームダイアログの見出し・追加導線の文言（全 feature 横断）。
//
// 見出しは「何をしているか」を名乗る。入力欄のラベル（「カテゴリ名」）を見出しに
// 流用すると、追加なのか編集なのかが読めないため分ける。
// 対象名は各 feature の labels が `dialogEntity` として持ち、ここは接尾辞の形だけを
// 固定する（「〜を追加/編集」の言い回しを feature ごとに書き分けない）。

export function dialogTitle(entity: string, isEditing: boolean): string {
  return isEditing ? `${entity}を編集` : `${entity}を追加`;
}

// アイコンのみの追加ボタンの読み上げ名。見出しと同じ対象名から組み立て、
// 「何を追加するのか」の表現が導線ごとにぶれないようにする。
export function addLabel(entity: string): string {
  return `${entity}を追加`;
}
