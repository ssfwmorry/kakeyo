import 'server-only';
import { sql } from 'drizzle-orm';
import { withDemoRead, withDemoWriteVoid } from '@/features/demo/server/inject';
import * as demoMaster from '@/features/demo/server/queries/master';
import * as demoPlannedRecord from '@/features/demo/server/queries/planned-record';
import {
  type DayClassification,
  getDayClassificationList
} from '@/features/master/server/repositories/dayClassification';
import { db } from '@/lib/server/db/client';
import { isForeignKeyError } from '@/lib/server/db/errors';
import { toYearMonthJst } from '@/lib/shared/domain/date';
import { planReorder } from '@/lib/shared/domain/reorder';
import type { SessionData } from '@/lib/shared/types/auth';
import type { Id } from '@/lib/shared/types/id';
import { err, ok, type Result } from '@/lib/shared/types/result';
import { resolvePlannedRecordOwnership } from '../domain/planned-record-fields';
import {
  enumerateTargetYearMonths,
  isWithinMaterializeHorizon
} from '../domain/target-year-months';
import type {
  GroupedPlannedRecordList,
  NotePlannedRecordDefault,
  PlannedRecordError
} from '../types';
import * as plannedRecordRepo from './repositories/planned-record';

// 削除失敗を分類する。実体化済み record が planned_record_id で参照している場合、
// FK 制約違反 → foreignKey（「紐づくデータがあり削除できません」）になる。
function toDeleteError(error: unknown): PlannedRecordError {
  return isForeignKeyError(error) ? 'foreignKey' : 'unknown';
}

// 設定「定期」タブ用: 定期一覧を self/pair に振り分けて返す。
export async function getPlannedRecordList(
  session: SessionData
): Promise<GroupedPlannedRecordList> {
  return withDemoRead(
    session,
    () => demoPlannedRecord.getPlannedRecordList(session),
    async () => {
      const rows = await plannedRecordRepo.findPlannedRecordRows(session);
      return {
        self: rows.filter((row) => !row.isPair),
        pair: rows.filter((row) => row.isPair)
      };
    }
  );
}

// note（定期入力）フォームが必要とする選択肢マスタ（毎月何日か）。
// type/method は被参照 feature（type-method）の server サービスから取得するため
// ここには含めない（所有境界。note ページ側が並行取得して渡す）。
// デモは DB へ触れずモックを返す（他の取得系と同じく withDemoRead に通す）。
export async function getDayClassifications(
  session: SessionData
): Promise<DayClassification[]> {
  return withDemoRead(
    session,
    () => demoMaster.getDayClassificationList(),
    () => getDayClassificationList()
  );
}

// note（定期編集）用: 初期値 1 件。scope 外・不存在は null（新規扱いにするかは呼び出し側）。
export async function getPlannedRecordForEdit(
  session: SessionData,
  id: Id
): Promise<NotePlannedRecordDefault | null> {
  return withDemoRead(
    session,
    () => demoPlannedRecord.getPlannedRecordForEdit(session, id),
    () => plannedRecordRepo.findPlannedRecordForEdit(session, id)
  );
}

type UpsertPlannedRecordInput = {
  id?: Id;
  dayClassificationId: Id;
  isPay: boolean;
  methodId: Id;
  isInstead: boolean;
  typeId: Id;
  subTypeId: Id | null;
  price: number;
  memo: string | null;
  // ペアモード（共有 ON/OFF）。session.pairId の有無とは別。
  isPair: boolean;
};

// 定期の登録・更新。record_type / user_id / pair_id は
// resolvePlannedRecordOwnership に一元化して導出する（自前で 0/5/10 を書かない）。
export async function upsertPlannedRecord(
  session: SessionData,
  input: UpsertPlannedRecordInput
): Promise<Result<void, PlannedRecordError>> {
  // 共有の定期には pairId 必須。クライアント値ではなく session の pairId を使う。
  if (input.isPair && session.pairId === null) {
    return err('pairRequired');
  }

  const ownership = resolvePlannedRecordOwnership({
    userUid: session.userUid,
    pairId: session.pairId,
    isPair: input.isPair,
    isInstead: input.isInstead
  });

  const fields: plannedRecordRepo.PlannedRecordUpsertFields = {
    userId: ownership.userId,
    pairId: ownership.pairId,
    dayClassificationId: input.dayClassificationId,
    isPay: input.isPay,
    methodId: input.methodId,
    typeId: input.typeId,
    subTypeId: input.subTypeId,
    price: input.price,
    memo: input.memo,
    recordType: ownership.recordType
  };

  return withDemoWriteVoid(session, async () => {
    if (input.id === undefined) {
      await plannedRecordRepo.insertPlannedRecord(fields);
      return ok(undefined);
    }
    // 更新は対象が scope 内か検証（他ペアの行を触らせない）。
    const target = await plannedRecordRepo.findPlannedRecordInScope(
      session,
      input.id
    );
    if (!target) {
      return err('notInScope');
    }
    await plannedRecordRepo.updatePlannedRecord(input.id, fields);
    return ok(undefined);
  });
}

// 定期の削除。実体化済み record は planned_record_id を外して残す（リポジトリ）。
// それでも FK に当たったときは foreignKey に分類する。
// scope 外は notInScope。
export async function deletePlannedRecord(
  session: SessionData,
  id: Id
): Promise<Result<void, PlannedRecordError>> {
  return withDemoWriteVoid(session, async () => {
    try {
      const result = await plannedRecordRepo.deletePlannedRecordById(
        session,
        id
      );
      if (!result.ok) {
        return err('notInScope');
      }
      return ok(undefined);
    } catch (error) {
      return err(toDeleteError(error));
    }
  });
}

// 実体化（planned_records → records）。
//
// scope: Drizzle の where ヘルパが使えない生 SQL のため、buildScopeWhere と同じ
// 「自分 or ペア」条件を SQL 片として組み立てる。

// 閲覧者 1 人分に絞る条件。planned_records / records いずれも user_id・pair_id の
// どちらか一方を持ち、ペアの行は pairs の user1_id / user2_id 経由で拾う
// （session.pairId は使わない）。
// 戻り値は ` and (` で始まる断片。`--` コメントと同じ行に埋め込むと先頭の and が
// コメントに飲まれて SQL が壊れるため、テンプレート側では必ず独立した行に置く。
function buildOwnerSqlFilter(
  userUid: string | null,
  table: 'planned_records' | 'records'
) {
  if (userUid === null) {
    return sql``;
  }
  const userId =
    table === 'planned_records'
      ? sql`planned_records.user_id`
      : sql`records.user_id`;
  return sql` and (
            ${userId} = ${userUid}
            or pairs.user1_id = ${userUid}
            or pairs.user2_id = ${userUid}
        )`;
}

// 1 ヶ月分の実体化。挿入行数を返す。userUid が null なら
// buildOwnerSqlFilter が空になり全ユーザーが対象
async function insertRecordsFromPlannedRecords(
  yearMonth: string,
  userUid: string | null
): Promise<number> {
  const result = await db.execute(sql`
    -- すでに planned_record_id が設定されている record を取り出す
    with summarized_records as (
        select
            planned_record_id
        from records
        left join pairs on
            records.pair_id = pairs.id
        where
            to_char(cast(datetime as date),'YYYY-MM') = ${yearMonth}
            and planned_record_id is not null
            ${buildOwnerSqlFilter(userUid, 'records')}
    )
    -- コピーされたものを登録する
    insert into records (
        user_id,
        pair_id,
        datetime,
        is_pay,
        method_id,
        type_id,
        sub_type_id,
        price,
        memo,
        planned_record_id,
        is_settled,
        record_type
    )
    select
        planned_records.user_id,
        planned_records.pair_id,
        cast(${yearMonth} || '-' || lpad(cast(day_classifications.value as character varying), 2, '0') as timestamp) as datetime,
        planned_records.is_pay,
        planned_records.method_id,
        planned_records.type_id,
        planned_records.sub_type_id,
        planned_records.price,
        planned_records.memo,
        planned_records.id as planned_record_id,
        case
            when planned_records.pair_id is not null and planned_records.user_id is not null then false
            else null
        end as is_settled,
        case
            when planned_records.pair_id is null then 0
            when planned_records.pair_id is not null and planned_records.user_id is not null then 5
            when planned_records.pair_id is not null and planned_records.user_id is null then 10
            else 15 -- 起こり得ない
        end as record_type
    from planned_records
    inner join day_classifications on
        planned_records.day_classification_id = day_classifications.id
    left join summarized_records on
        planned_records.id = summarized_records.planned_record_id
    left join pairs on
        planned_records.pair_id = pairs.id
    where
        summarized_records.planned_record_id is null -- planned_record_id が登録されていないものを抽出
        ${buildOwnerSqlFilter(userUid, 'planned_records')}
        and cast(planned_records.updated_at as date) <=  cast((${yearMonth} || '-01') as date) -- planned_record が登録された後の期間でのみ、record 登録を行う
        and cast(${yearMonth} || '-' || lpad(cast(day_classifications.value as character varying), 2, '0') as timestamp) > now() -- 登録される datetime が未来の場合のみrecord 登録を行う
  `);
  return result.rowCount ?? 0;
}

// 日次バッチの入口（Cron Route 専用）。当月〜7 ヶ月後を月ごとに実体化し、
// 対象月数と挿入行数を返す。
export async function postRecordsForAllUsers(): Promise<{
  months: number;
  inserted: number;
}> {
  const yearMonths = enumerateTargetYearMonths(toYearMonthJst(new Date()));
  let inserted = 0;
  // 同一テーブルへの INSERT を月順に直列実行する（並列にしない）。
  for (const yearMonth of yearMonths) {
    inserted += await insertRecordsFromPlannedRecords(yearMonth, null);
  }
  return { months: yearMonths.length, inserted };
}

// カレンダー表示時の実体化。Vercel Cron が有効化されるまでの暫定で、有効化したら
// この関数と呼び出し元を削除する。
//
// 開いた人の表示中の月だけを対象にし、閲覧者 1 人に絞る（他人のページ閲覧で
// 他人の record を作らない）。呼び出し側は月データの取得より先に await する
// （作られた record をその描画に載せるため）。
export async function materializePlannedRecordsForMonth(
  session: SessionData,
  yearMonth: string
): Promise<void> {
  if (session.isDemo) {
    return;
  }
  if (!isWithinMaterializeHorizon(toYearMonthJst(new Date()), yearMonth)) {
    return;
  }
  await insertRecordsFromPlannedRecords(yearMonth, session.userUid);
}

// 任意順の並べ替え。全 id が scope 内かつ同じ所有（self / pair）に揃っていることを
// 検証してから、既存の sort 値を割り当て直す。
export async function reorderPlannedRecords(
  session: SessionData,
  ids: Id[]
): Promise<Result<void, PlannedRecordError>> {
  return withDemoWriteVoid(session, async () => {
    const rows = await plannedRecordRepo.findPlannedRecordRowsForReorder(
      session,
      ids
    );
    const plan = planReorder(rows, ids, (row) => String(row.pairId));
    if (plan === null) {
      return err('notInScope');
    }
    await plannedRecordRepo.updatePlannedRecordSorts(plan);
    return ok(undefined);
  });
}
