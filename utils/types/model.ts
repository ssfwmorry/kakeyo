export type ColorClassification = {
  id: number;
  name: string;
};

export type DayClassification = {
  id: number;
  name: string;
};

export type Memo = {
  id: number;
  user_id: string | null;
  pair_id: number | null;
  memo: string;
};
