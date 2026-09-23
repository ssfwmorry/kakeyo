import 'server-only';
import { resolveRecordType } from '@/lib/shared/domain/recordType';
import type { RecordType } from '@/lib/shared/types/recordType';
import { days } from './day-classifications';
import { methods } from './methods';
import { defineTable, indexById } from './table';
import { types } from './types';
import { type Owned, owner } from './users';

// planned_records（定期）。records の定期由来 record は plannedRecords.<key>.id を参照する。
// record_type は実処理と同じ resolveRecordType で導出する（0/10 を手書きしない）。

export type DemoPlannedRecord = Owned & {
  id: number;
  dayClassificationId: number;
  isPay: boolean;
  methodId: number;
  typeId: number;
  subTypeId: number | null;
  price: number;
  memo: string | null;
  recordType: RecordType;
  sort: number;
};

const selfType = resolveRecordType({ isPair: false, isInstead: false });
const pairType = resolveRecordType({ isPair: true, isInstead: false });

export const [plannedRecords, plannedRecordRows] = defineTable({
  housing: {
    ...owner.self,
    dayClassificationId: days.day1.id,
    isPay: true,
    methodId: methods.debit.id,
    typeId: types.housing.id,
    subTypeId: null,
    price: 80000,
    memo: '家賃',
    recordType: selfType,
    sort: 1
  },
  salary: {
    ...owner.self,
    dayClassificationId: days.day25.id,
    isPay: false,
    methodId: methods.transfer.id,
    typeId: types.salary.id,
    subTypeId: null,
    price: 250000,
    memo: '給料',
    recordType: selfType,
    sort: 2
  },
  pairRent: {
    ...owner.pair,
    dayClassificationId: days.day25.id,
    isPay: true,
    methodId: methods.jointDebit.id,
    typeId: types.pairHousing.id,
    subTypeId: null,
    price: 120000,
    memo: '家賃',
    recordType: pairType,
    sort: 1
  },
  pairAllowance: {
    ...owner.pair,
    dayClassificationId: days.day10.id,
    isPay: false,
    methodId: methods.jointDeposit.id,
    typeId: types.pairAllowance.id,
    subTypeId: null,
    price: 15000,
    memo: '手当',
    recordType: pairType,
    sort: 2
  }
} satisfies Record<string, Omit<DemoPlannedRecord, 'id'>>);

export const findPlannedRecord = indexById(
  'planned_records',
  plannedRecordRows
);
