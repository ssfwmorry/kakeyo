import { describe, expect, it } from 'vitest';
import type { ShortCutItem } from '@/features/memo-shortcut';
import { RecordType } from '@/lib/shared/types/recordType';
import { isInsteadShortcut, selectShortcutsForMode } from './shortcut';

function shortcut(id: number, recordType: ShortCutItem['recordType']) {
  return {
    id,
    isPay: true,
    price: 500,
    memo: null,
    recordType,
    methodId: 1,
    methodName: '現金',
    typeId: 1,
    typeName: '食費',
    colorName: 'orange',
    subTypeId: null,
    subTypeName: null
  } satisfies ShortCutItem;
}

const items = [
  shortcut(1, RecordType.self),
  shortcut(2, RecordType.instead),
  shortcut(3, RecordType.pair)
];

describe('selectShortcutsForMode', () => {
  it('個人モードは個人の記録になるものだけ', () => {
    expect(selectShortcutsForMode(items, false).map((i) => i.id)).toEqual([1]);
  });

  it('共有モードは立替と共有の両方', () => {
    expect(selectShortcutsForMode(items, true).map((i) => i.id)).toEqual([
      2, 3
    ]);
  });
});

describe('isInsteadShortcut', () => {
  it('立替だけ true', () => {
    expect(isInsteadShortcut(items[1])).toBe(true);
    expect(isInsteadShortcut(items[2])).toBe(false);
    expect(isInsteadShortcut(items[0])).toBe(false);
  });
});
