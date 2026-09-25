// 入力フローが 2 枚の画面で共有する入力中の値。
// 旧 note-record-form の NoteState と同じ形だが、金額は number で持つ
// （テンキーが number で計算するので、文字列との往復を挟まない）。

export type NoteState = {
  isPay: boolean;
  // YYYY-MM-DD（JST の暦日）。
  date: string;
  typeId: number | null;
  subTypeId: number | null;
  methodId: number | null;
  // 立替。共有 & 支出のときだけ意味を持つ。既定 ON。
  isInstead: boolean;
  memo: string;
  price: number;
};
