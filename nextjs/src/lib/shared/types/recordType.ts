// record_type（家計計算の起点）の定義。
// records / planned_records / short_cuts が共有する分類。
//
// - 0  SELF       : 個人の記録
// - 5  INSTEAD    : ペアで一方が立て替えた記録（is_pay=true 固定・精算対象）
// - 10 PAIR       : 二人共通の記録
// - 15 SETTLEMENT : 精算のための送金記録（is_pay=null・type_id なし）

export const RecordType = {
  self: 0,
  instead: 5,
  pair: 10,
  settlement: 15
} as const;

export type RecordType = (typeof RecordType)[keyof typeof RecordType];
