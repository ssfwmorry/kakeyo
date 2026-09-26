// 新規入力では直近の履歴より、マスタで決めた並び順の先頭を使う。
// これはマスタ画面の並べ替えが方法の表示順を決める設計に一致させるため。
export function resolveMethodId({
  methods,
  selected,
  isEditing
}: {
  methods: { id: number }[];
  selected: number | null;
  isEditing: boolean;
}): number | null {
  const has = (id: number | null) =>
    id !== null && methods.some((method) => method.id === id);

  if (has(selected)) {
    return selected;
  }
  if (isEditing && selected !== null) {
    return null;
  }

  return methods[0]?.id ?? null;
}
