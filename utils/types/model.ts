export type ColorClassification = {
  id: number;
  name: string;
};

export type DayClassification = {
  id: number;
  name: string;
  value: number;
};

export type Memo = {
  id: number;
  userId: string | null;
  pairId: number | null;
  memo: string;
};
