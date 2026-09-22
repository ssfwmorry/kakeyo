import 'server-only';
import { withDemoRead, withDemoWriteVoid } from '@/features/auth/server/demo';
import {
  type DayClassification,
  getDayClassificationList
} from '@/features/master/server/repositories/dayClassification';
import { prisma } from '@/lib/server/db/client';
import { serverEnv } from '@/lib/server/env.server';
import { todayJst, toYearMonthJst } from '@/lib/shared/domain/date';
import type { SessionData } from '@/lib/shared/types/auth';
import type { Id } from '@/lib/shared/types/id';
import { err, ok, type Result } from '@/lib/shared/types/result';
import { Prisma } from '@/prisma/generated/client';
import { resolvePlannedRecordOwnership } from '../domain/planned-record-fields';
import { enumerateTargetYearMonths } from '../domain/target-year-months';
import type {
  GroupedPlannedRecordList,
  NotePlannedRecordDefault,
  PlannedRecordError
} from '../types';
import {
  demoDayClassifications,
  demoGroupedPlannedRecordList,
  findDemoPlannedRecordDefault
} from './demo';
import * as plannedRecordRepo from './repositories/planned-record';

// L3 planned-record サービス層（server-only）。Server Action / Cron Route から呼ぶ入口。
// 戻りは Result<T, PlannedRecordError>（UI 文言は持たない）。取得は withDemoRead、
// 更新は withDemoWriteVoid でデモ注入（デモは DB へ触れず成功扱い）。
// userUid / pairId は session から作りクライアント値を信用しない（scope 漏れ防止）。

// FK 制約違反（P2003）を foreignKey へ写す。それ以外は unknown。
// 旧 FE は PostgrestErrorCode.FOREIGN_KEY(23503) 判定で「紐づくデータがあるので
// 削除できません」を出していた（実体化済み record が planned_record_id で参照する）。
function toDeleteError(error: unknown): PlannedRecordError {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2003'
  ) {
    return 'foreignKey';
  }
  return 'unknown';
}

// ============================================================
// READ
// ============================================================

// 設定「定期」タブ用: 定期一覧を self/pair に振り分けて返す（旧 getPlannedRecordList）。
export async function getPlannedRecordList(
  session: SessionData
): Promise<GroupedPlannedRecordList> {
  return withDemoRead(
    session.isDemo,
    demoGroupedPlannedRecordList,
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
  return withDemoRead(session.isDemo, demoDayClassifications, () =>
    getDayClassificationList()
  );
}

// note（定期編集）用: 初期値 1 件。scope 外・不存在は null（新規扱いにするかは呼び出し側）。
export async function getPlannedRecordForEdit(
  session: SessionData,
  id: Id
): Promise<NotePlannedRecordDefault | null> {
  return withDemoRead(session.isDemo, findDemoPlannedRecordDefault(id), () =>
    plannedRecordRepo.findPlannedRecordForEdit(session, id)
  );
}

// ============================================================
// CRUD
// ============================================================

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

  return withDemoWriteVoid(session.isDemo, async () => {
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

// 定期の削除。実体化済み record が紐づく場合は FK エラー → foreignKey
// （旧仕様どおり削除不可。records.planned_record_id は on delete set null ではなく
// FK 参照が残るため）。scope 外は notInScope。
export async function deletePlannedRecord(
  session: SessionData,
  id: Id
): Promise<Result<void, PlannedRecordError>> {
  return withDemoWriteVoid(session.isDemo, async () => {
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

// 並び順の入替。対象 2 行が両方 scope 内であることを検証してから入替
// （他ペアの並びを触らせない。type-method の swap と同流儀）。
export async function swapPlannedRecord(
  session: SessionData,
  prevId: Id,
  nextId: Id
): Promise<Result<void, PlannedRecordError>> {
  return withDemoWriteVoid(session.isDemo, async () => {
    const [a, b] = await Promise.all([
      plannedRecordRepo.findPlannedRecordInScope(session, prevId),
      plannedRecordRepo.findPlannedRecordInScope(session, nextId)
    ]);
    if (!a || !b) {
      return err('notInScope');
    }
    await plannedRecordRepo.swapPlannedRecordSort(a, b);
    return ok(undefined);
  });
}

// ============================================================
// 実体化バッチ（グループ C: func_post_records の $queryRaw 移植）
// ============================================================
//
// 旧 useCalendarStore.updateRange は「表示月が現在+7 ヶ月より前なら表示月分を
// post_records」していた（閲覧駆動・表示コードに副作用 INSERT が混在）。
// 方針確定書 §7 の再設計により、実体化は Vercel Cron（日次 1 回）からこの
// サービスだけが行い、表示コードは純粋な読み取りのみとする。
//
// SQL は docs/database/functions.md の func_post_records を「そのまま」移植する
// （CASE WHEN・day_classifications による日付組み立て・updated_at / now() 条件を
// 一切改変しない。「翻訳」禁止）。Cron 化に伴う差分は次の 2 点のみ:
//   1. input_user_id によるユーザー絞り込みを除去（全ユーザー対象の日次バッチ。
//      buildScopeWhere 例外が指示されている唯一の箇所）
//   2. スキーマ修飾 `develop.` を環境変数のスキーマ名（develop / public）に差し替え
//      （adapter-pg の schema オプションは ORM クエリのみに効き、$queryRaw の
//      生 SQL には search_path が適用されないため、明示修飾が必須）

// スキーマ名は識別子としてインライン展開するため、念のため形式を検証する
// （env 由来の信頼値だが、SQL へ raw 展開する以上ここで機械的に縛る）。
const SCHEMA_NAME_PATTERN = /^[a-z_][a-z0-9_]*$/;

function schemaSql(): Prisma.Sql {
  const schema = serverEnv.supabaseDatabaseSchema;
  if (!SCHEMA_NAME_PATTERN.test(schema)) {
    throw new Error(`Invalid database schema name: ${schema}`);
  }
  return Prisma.raw(schema);
}

// 1 ヶ月分の実体化（func_post_records 相当）。挿入行数を返す。
async function insertRecordsFromPlannedRecords(
  yearMonth: string
): Promise<number> {
  const schema = schemaSql();
  return prisma.$executeRaw`
    -- すでに planned_record_id が設定されている record を取り出す
    with summarized_records as (
        select
            planned_record_id
        from ${schema}.records
        left join ${schema}.pairs on
            records.pair_id = pairs.id
        where
            to_char(cast(datetime as date),'YYYY-MM') = ${yearMonth}
            and planned_record_id is not null
    )
    -- コピーされたものを登録する
    insert into ${schema}.records (
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
    from ${schema}.planned_records
    inner join ${schema}.day_classifications on
        planned_records.day_classification_id = day_classifications.id
    left join summarized_records on
        planned_records.id = summarized_records.planned_record_id
    left join ${schema}.pairs on
        planned_records.pair_id = pairs.id
    where
        summarized_records.planned_record_id is null -- planned_record_id が登録されていないものを抽出
        and cast(planned_records.updated_at as date) <=  cast((${yearMonth} || '-01') as date) -- planned_record が登録された後の期間でのみ、record 登録を行う
        and cast(${yearMonth} || '-' || lpad(cast(day_classifications.value as character varying), 2, '0') as timestamp) > now() -- 登録される datetime が未来の場合のみrecord 登録を行う
  `;
}

// 日次バッチの入口（Cron Route 専用）。当月〜7 ヶ月後（旧実装で実体化されえた
// 全範囲）を月ごとに実体化し、対象月数と挿入行数を返す。
// 過去月は SQL の `datetime > now()` 条件で挿入 0 件のため対象に含めない。
export async function postRecordsForAllUsers(): Promise<{
  months: number;
  inserted: number;
}> {
  const yearMonths = enumerateTargetYearMonths(toYearMonthJst(todayJst()));
  let inserted = 0;
  // 同一テーブルへの INSERT を月順に直列実行する（並列にしない）。
  for (const yearMonth of yearMonths) {
    inserted += await insertRecordsFromPlannedRecords(yearMonth);
  }
  return { months: yearMonths.length, inserted };
}
