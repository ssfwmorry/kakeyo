import { describe, expect, it } from 'vitest';
import { resolveRecordType } from '@/lib/shared/domain/recordType';
import { RecordType } from '@/lib/shared/types/recordType';
import { bankBalanceRows, bankRows } from './banks';
import { colorRows } from './colors';
import { dayRows } from './day-classifications';
import { memoRows } from './memos';
import { methodRows } from './methods';
import { planTypeRows } from './plan-types';
import { plannedRecordRows } from './planned-records';
import { planRows } from './plans';
import { recordRows } from './records';
import { reminderRows } from './reminders';
import { shortCutRows } from './short-cuts';
import { subTypeRows, typeRows } from './types';
import { demoPair, demoUsers, type Owned } from './users';

// dataset の参照整合（実 DB の FK・CHECK 制約に相当）を固定する。
// id は自動採番のため衝突しないが、参照先のキー間違い・所有者の食い違いは型では検知できない。

const ids = (rows: { id: number }[]) => new Set(rows.map((row) => row.id));
const colorIds = ids(colorRows);
const typeIds = ids(typeRows);
const subTypeIds = ids(subTypeRows);
const methodIds = ids(methodRows);
const dayIds = ids(dayRows);
const plannedRecordIds = ids(plannedRecordRows);
const planTypeIds = ids(planTypeRows);
const bankIds = ids(bankRows);
const userUids = new Set<string>([demoUsers.self.uid, demoUsers.partner.uid]);

// FK: 参照先が実在する（null は「参照なし」で許容）。
function expectRef(targetIds: Set<number>, id: number | null) {
  if (id !== null) {
    expect(targetIds.has(id)).toBe(true);
  }
}

// user_id / pair_id の「どちらか一方」を持ち、参照先のユーザ・ペアが実在する。
function expectOwned(row: Owned) {
  expect(row.userUid !== null || row.pairId !== null).toBe(true);
  if (row.userUid !== null) {
    expect(userUids.has(row.userUid)).toBe(true);
  }
  if (row.pairId !== null) {
    expect(row.pairId).toBe(demoPair.id);
  }
}

// サブカテゴリが親カテゴリに属する（record / short_cut の type と sub_type の組が整合する）。
function expectSubTypeOf(typeId: number | null, subTypeId: number | null) {
  if (subTypeId === null) {
    return;
  }
  expect(subTypeIds.has(subTypeId)).toBe(true);
  const subType = subTypeRows.find((sub) => sub.id === subTypeId);
  expect(subType?.typeId).toBe(typeId);
}

const byRecordType = (recordType: RecordType) =>
  recordRows.filter((row) => row.recordType === recordType);

describe('demo dataset の所有者と色', () => {
  it('所有者を持つテーブルは user_id / pair_id のどちらか一方を持つ', () => {
    const owned: Owned[] = [
      ...typeRows,
      ...methodRows,
      ...planTypeRows,
      ...reminderRows,
      ...memoRows,
      ...planRows,
      ...plannedRecordRows,
      ...recordRows
    ];
    for (const row of owned) {
      expectOwned(row);
    }
  });

  it('色を持つテーブルは実在する色を参照する', () => {
    const colored = [
      ...typeRows,
      ...methodRows,
      ...planTypeRows,
      ...reminderRows,
      ...bankRows
    ];
    for (const row of colored) {
      expectRef(colorIds, row.colorId);
    }
  });
});

describe('demo dataset の参照整合', () => {
  it('sub_types は実在する親カテゴリに属する', () => {
    for (const row of subTypeRows) {
      expectRef(typeIds, row.typeId);
    }
  });

  it('planned_records は実在するマスタを参照し、record_type と所有者が整合する', () => {
    for (const row of plannedRecordRows) {
      expectRef(dayIds, row.dayClassificationId);
      expectRef(methodIds, row.methodId);
      expectRef(typeIds, row.typeId);
      // 個人は user_id のみ、共有は pair_id のみ、立替は両方（立替者を特定する）。
      expect(row.recordType).toBe(
        resolveRecordType({
          isPair: row.pairId !== null,
          isInstead: row.pairId !== null && row.userUid !== null
        })
      );
    }
  });

  it('records は実在するマスタ・定期を参照し、サブカテゴリは親カテゴリに属する', () => {
    for (const row of recordRows) {
      expectRef(methodIds, row.methodId);
      expectRef(typeIds, row.typeId);
      expectRef(plannedRecordIds, row.plannedRecordId);
      expectSubTypeOf(row.typeId, row.subTypeId);
    }
  });

  it('short_cuts は実在するマスタを参照する', () => {
    for (const row of shortCutRows) {
      expect(userUids.has(row.userUid)).toBe(true);
      expectRef(methodIds, row.methodId);
      expectRef(typeIds, row.typeId);
      expectSubTypeOf(row.typeId, row.subTypeId);
    }
  });

  it('plans / bank_balances は実在する行を参照する', () => {
    for (const row of planRows) {
      expectRef(planTypeIds, row.planTypeId);
    }
    for (const row of bankBalanceRows) {
      expectRef(bankIds, row.bankId);
    }
  });
});

describe('records の record_type と所有者列（実 DB の CHECK 制約相当）', () => {
  it('個人(0): pair_id なし・精算概念なし', () => {
    for (const row of byRecordType(RecordType.self)) {
      expect(row.pairId).toBeNull();
      expect(row.isSettled).toBeNull();
    }
  });

  it('共有(10): user_id なし・精算概念なし', () => {
    for (const row of byRecordType(RecordType.pair)) {
      expect(row.userUid).toBeNull();
      expect(row.isSettled).toBeNull();
    }
  });

  it('立替(5): 起票者と pair_id の両方を持ち、精算フラグを持つ', () => {
    const rows = byRecordType(RecordType.instead);
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.userUid).not.toBeNull();
      expect(row.pairId).toBe(demoPair.id);
      expect(typeof row.isSettled).toBe('boolean');
    }
  });

  it('精算(15): 起票者と pair_id を持ち、type / is_pay を持たない', () => {
    const rows = byRecordType(RecordType.settlement);
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.userUid).not.toBeNull();
      expect(row.pairId).toBe(demoPair.id);
      expect(row.typeId).toBeNull();
      expect(row.isPay).toBeNull();
    }
  });
});
