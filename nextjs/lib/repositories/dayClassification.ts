import 'server-only';
import type { Id } from '@/lib/types/id';

// L1 マスタ（day_classification）の「被参照 I/F」先置きスタブ。
// L3 定期+Cron が参照するため型のみ先に確定。中身は L1 が実装する。
// マスタは全ユーザ共通のため scope 絞り込みは不要。

// day_classifications: 毎月何日か（1/10/15/25 日）。value が実際の「日」。
export type DayClassification = {
  id: Id;
  name: string;
  value: number;
};

const notImplemented = (name: string) =>
  new Error(
    `dayClassificationRepository.${name} は L1 エージェントが実装します（I/F スタブ）`
  );

// READ
export async function getDayClassificationList(): Promise<DayClassification[]> {
  throw notImplemented('getDayClassificationList');
}
