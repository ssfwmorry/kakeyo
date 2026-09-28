import { describe, expect, it } from 'vitest';
import type { PlannedRecordListItem } from '@/features/planned-record';
import {
  isLockedItem,
  itemDescription,
  itemTitle,
  toPlannedRecordDefault
} from './row-text';

const base: PlannedRecordListItem = {
  id: 1,
  isSelf: true,
  isPay: true,
  price: 4800,
  memo: null,
  sort: 1,
  isPair: false,
  pairUserName: null,
  dayClassificationId: 2,
  dayClassificationName: '毎月 10 日',
  methodId: 3,
  methodName: 'クレカ',
  methodColorClassificationName: 'blue',
  typeId: 4,
  typeName: '通信',
  typeColorClassificationName: 'cyan',
  subTypeId: 5,
  subTypeName: 'スマホ'
};

describe('itemTitle', () => {
  it('カテゴリ › サブカテゴリ', () => {
    expect(itemTitle(base)).toBe('通信 › スマホ');
    expect(itemTitle({ ...base, subTypeId: null, subTypeName: null })).toBe(
      '通信'
    );
  });
});

describe('itemDescription', () => {
  it('個人は方法とメモ', () => {
    expect(itemDescription(base)).toBe('クレカ');
    expect(itemDescription({ ...base, memo: '動画サブスク' })).toBe(
      'クレカ · 動画サブスク'
    );
  });

  it('共有の支出は立替か共有のお金かを挟む', () => {
    const pair = { ...base, isPair: true, memo: '光回線' };
    expect(itemDescription({ ...pair, pairUserName: 'たろう' })).toBe(
      'クレカ · 自分が立替 · 光回線'
    );
    expect(itemDescription(pair)).toBe('クレカ · 共有のお金 · 光回線');
  });

  it('共有の収入には立替の区分を出さない', () => {
    expect(itemDescription({ ...base, isPair: true, isPay: false })).toBe(
      'クレカ'
    );
  });

  it('パートナーの立替は方法を出さず名前にする', () => {
    const locked = {
      ...base,
      isPair: true,
      isSelf: false,
      pairUserName: 'はなこ',
      memo: '電気代'
    };
    expect(isLockedItem(locked)).toBe(true);
    expect(itemDescription(locked)).toBe('はなこさんの立替 · 電気代');
    expect(itemDescription({ ...locked, memo: null })).toBe('はなこさんの立替');
  });
});

describe('toPlannedRecordDefault', () => {
  it('立替は共有かつ立替者ありから導く', () => {
    expect(toPlannedRecordDefault(base).isInstead).toBe(false);
    expect(
      toPlannedRecordDefault({ ...base, isPair: true, pairUserName: 'たろう' })
        .isInstead
    ).toBe(true);
    expect(toPlannedRecordDefault({ ...base, isPair: true }).isInstead).toBe(
      false
    );
  });
});
