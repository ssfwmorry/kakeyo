import 'server-only';
import {
  toDisplayTypeName,
  toIsInstead,
  toIsSettlement
} from '@/features/record/domain/record-fields';
import { SETTLEMENT_DISPLAY } from '@/features/record/labels';
import type {
  LastUsedMethodIds,
  NoteRecordDefault,
  PairedRecordItem,
  RecordListItem,
  SummarizedRecordItem,
  SummarizedRecordQuery
} from '@/features/record/types';
import { toDateStringJst } from '@/lib/shared/domain/date';
import type { SessionScope } from '@/lib/shared/types/auth';
import { RecordType } from '@/lib/shared/types/recordType';
import { colorName } from '../dataset/colors';
import { findMethod } from '../dataset/methods';
import { type DemoRecord, recordRows } from '../dataset/records';
import { visibleTo } from '../dataset/scope';
import { findSubType, findType } from '../dataset/types';
import { demoUsers, findDemoUserName, type Owned } from '../dataset/users';

// record のデモ射影。dataset の records を method / type / sub_type / user と join した
// 「一覧 DTO + 所有者列 + 精算フラグ + 年月」を 1 度だけ組み、各取得系はそれを絞って DTO へ落とす。
// 絞り込み条件は実リポジトリ（record/server/repositories/record.ts）の where と同じ規則で書く。

export type DemoRecordView = RecordListItem &
  Owned & {
    isSettled: boolean | null;
    yearMonth: string;
  };

// join（recordInclude 相当）。デモの閲覧者は常に自分（たろう）なので isSelf もここで確定する。
function toView(row: DemoRecord): DemoRecordView {
  const method = findMethod(row.methodId);
  const type = row.typeId === null ? null : findType(row.typeId);
  const subType = row.subTypeId === null ? null : findSubType(row.subTypeId);
  const isPair = row.pairId !== null;
  return {
    id: row.id,
    userUid: row.userUid,
    pairId: row.pairId,
    isSelf: row.userUid === demoUsers.self.uid,
    datetime: row.datetime,
    yearMonth: row.yearMonth,
    isPay: row.isPay,
    price: row.price,
    memo: row.memo,
    recordType: row.recordType,
    plannedRecordId: row.plannedRecordId,
    methodId: row.methodId,
    methodName: method.name,
    methodColorClassificationName: colorName(method.colorId),
    typeId: row.typeId,
    typeName: toDisplayTypeName(type?.name ?? null, row.recordType),
    subTypeId: row.subTypeId,
    subTypeName: subType?.name ?? null,
    typeColorClassificationName: type ? colorName(type.colorId) : null,
    isPair,
    pairUserName: isPair ? findDemoUserName(row.userUid) : null,
    isInstead: toIsInstead(isPair, row.recordType),
    isSettlement: toIsSettlement(isPair, row.recordType),
    isSettled: row.isSettled
  };
}

// 全 record の join 済みビュー（datetime 昇順・同時刻は id 昇順）。
const recordViews: DemoRecordView[] = recordRows
  .map(toView)
  .sort((a, b) => a.datetime.getTime() - b.datetime.getTime() || a.id - b.id);

// scope で見える record（buildScopeWhere 相当）。summary のデモ集計もこれを入力にする。
export function visibleRecordViews(scope: SessionScope): DemoRecordView[] {
  return visibleTo(scope, recordViews);
}

function toRecordListItem(view: DemoRecordView): RecordListItem {
  const {
    userUid: _userUid,
    pairId: _pairId,
    isSettled: _isSettled,
    yearMonth: _yearMonth,
    ...item
  } = view;
  return item;
}

function toSummarizedRecordItem(view: DemoRecordView): SummarizedRecordItem {
  const { isSettlement: _isSettlement, ...item } = toRecordListItem(view);
  return item;
}

// getRecordList 相当（カレンダー用）: 期間内（両端含む）の record。
export function getRecordListForRange(
  scope: SessionScope,
  start: Date,
  end: Date
): RecordListItem[] {
  return visibleRecordViews(scope)
    .filter((view) => view.datetime >= start && view.datetime <= end)
    .map(toRecordListItem);
}

// getSummarizedRecordList 相当（records 明細用）。buildSummarizedPairWhere ほかと同じ条件で絞る。
// - pair && 立替込み   : pair_id あり
// - pair && 立替なし   : pair_id あり かつ 共有(10) / 精算(15)
// - 個人 && 立替込み   : 自分が起票（個人 + 自分の立替 + 自分が払った精算）
// - 個人 && 立替なし   : 自分が起票 かつ pair_id なし
// 加えて type 未設定（精算）除外・isPay・年月・カテゴリ or 方法で絞り、日時降順。
export function getSummarizedRecords(
  scope: SessionScope,
  query: SummarizedRecordQuery
): SummarizedRecordItem[] {
  return visibleRecordViews(scope)
    .filter(
      (view) =>
        matchesPairScope(view, query) &&
        view.typeId !== null &&
        view.isPay === query.isPay &&
        view.yearMonth === query.yearMonth &&
        matchesTarget(view, query)
    )
    .sort((a, b) => b.datetime.getTime() - a.datetime.getTime())
    .map(toSummarizedRecordItem);
}

// カテゴリ（+ 任意のサブカテゴリ）or 方法での絞り込み。
function matchesTarget(
  view: DemoRecordView,
  query: Pick<SummarizedRecordQuery, 'isType' | 'id' | 'subTypeId'>
): boolean {
  if (!query.isType) {
    return view.methodId === query.id;
  }
  return (
    view.typeId === query.id &&
    (query.subTypeId === null || view.subTypeId === query.subTypeId)
  );
}

function matchesPairScope(
  view: DemoRecordView,
  query: Pick<SummarizedRecordQuery, 'isPair' | 'isIncludeInstead'>
): boolean {
  if (query.isPair) {
    return (
      view.isPair &&
      (query.isIncludeInstead || view.recordType !== RecordType.instead)
    );
  }
  return view.isSelf && (query.isIncludeInstead || !view.isPair);
}

// getPairedRecordList 相当（精算画面用）: 指定月のペア record（pair_id あり）。日時降順。
// solo デモは共有 record が見えないため空。
export function getPairedRecords(
  scope: SessionScope,
  yearMonth: string
): PairedRecordItem[] {
  return visibleRecordViews(scope)
    .filter((view) => view.isPair && view.yearMonth === yearMonth)
    .sort((a, b) => b.datetime.getTime() - a.datetime.getTime())
    .map((view) => ({
      id: view.id,
      datetime: view.datetime,
      isSelf: view.isSelf,
      isPay: view.isPay,
      price: view.price,
      memo: view.memo,
      recordType: view.recordType,
      isSettled: view.isSettled,
      isPlannedRecord: view.plannedRecordId !== null,
      methodName: view.methodName,
      methodColorClassificationName: view.methodColorClassificationName,
      typeName: view.typeName ?? SETTLEMENT_DISPLAY.name,
      subTypeName: view.subTypeName,
      typeColorClassificationName:
        view.typeColorClassificationName ?? SETTLEMENT_DISPLAY.color,
      isInstead: view.recordType === RecordType.instead,
      isSettlement: view.recordType === RecordType.settlement
    }));
}

// findRecordForEdit 相当（note = 記録編集用）: scope 内の record 1 件をプリフィル初期値へ写す。
// 精算 record（record_type=15）は編集導線に乗らない前提（本体と同様）。
export function getRecordForEdit(
  scope: SessionScope,
  id: number
): NoteRecordDefault | null {
  const view = visibleRecordViews(scope).find(
    (row) => row.id === id && row.recordType !== RecordType.settlement
  );
  if (!view) {
    return null;
  }
  return {
    id: view.id,
    isPay: view.isPay ?? true,
    date: toDateStringJst(view.datetime),
    methodId: view.methodId,
    typeId: view.typeId,
    subTypeId: view.subTypeId,
    memo: view.memo,
    price: view.price,
    isInstead: view.isInstead ?? false,
    isPair: view.isPair
  };
}

// 実リポジトリの findLastUsedMethodIds と同じ規則（組み合わせごとに datetime 降順の先頭）。
export function getLastUsedMethodIds(scope: SessionScope): LastUsedMethodIds {
  // recordViews は datetime 昇順なので、末尾から探せば最新になる。
  const views = visibleRecordViews(scope);
  const latestMethodId = (
    isPay: boolean,
    recordType: RecordType
  ): number | null => {
    for (let i = views.length - 1; i >= 0; i -= 1) {
      const view = views[i];
      if (view.isPay === isPay && view.recordType === recordType) {
        return view.methodId;
      }
    }
    return null;
  };
  return {
    paySelf: latestMethodId(true, RecordType.self),
    incomeSelf: latestMethodId(false, RecordType.self),
    payPairInstead: latestMethodId(true, RecordType.instead),
    payPairShared: latestMethodId(true, RecordType.pair),
    incomePair: latestMethodId(false, RecordType.pair)
  };
}
