// record feature の公開 API（barrel）。
// ★ server-only を含むモジュール（server/repositories・server/services・server/demo・
//   actions）は re-export しない（FE から誤 import されるとビルドが壊れる）。
//   L6 summary/records は取得系サービスを @/features/record/server/services から、
//   L3 定期 Cron は insertRecords / RecordInsertInput を
//   @/features/record/server/repositories/record から直接 import する。
//
// 公開するのは Client Component と FE 型（他レーンが戻り型として参照する）のみ。

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
