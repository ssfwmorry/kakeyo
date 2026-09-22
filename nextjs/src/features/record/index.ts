// record feature の公開 API（barrel）。
// ★ server-only を含むモジュール（server/repositories・server/services・server/demo）は
//   re-export しない（FE から誤 import されるとビルドが壊れる）。
//   L6 summary/records は取得系サービスを @/features/record/server/services から、
//   L3 定期 Cron は insertRecords / RecordInsertInput を
//   @/features/record/server/repositories/record から直接 import する。
//
// 公開するのは Client Component・FE 型（他レーンが戻り型として参照する）・
// および精算の Server Actions。精算（settlement）は「record 所有・summary(L6) 表示」の
// 跨りレーンのため、summary の Client からも呼べるよう公開点をここに置く。
// ※ 'use server' の Server Actions は server-only 実体と異なり、元来 Client から呼ばれる
//   公開 I/F（Next のビルドで server 参照へ変換される）ため barrel re-export で安全。

export {
  createSettlementRecordAction,
  settleRecordsAction
} from './actions/settlement-actions';
export { colorHex } from './color';
export type { NoteRecordDefault } from './components/note-record-form';
export { NoteRecordForm } from './components/note-record-form';
export { SETTLEMENT_DISPLAY } from './labels';
export type {
  PairedRecordItem,
  RecordError,
  RecordListItem,
  SummarizedRecordItem,
  SummarizedRecordQuery
} from './types';
