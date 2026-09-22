import { toDateStringJst } from '@/lib/shared/domain/date';
import type { Id } from '@/lib/shared/types/id';

// bank 残高テーブルの合計補完ロジック（純粋関数・FE/BE 両用）。
// server-only を含めない（FE から import されてもビルドが壊れない）。
//
// 合計補完の仕様:
// - ある記録日に口座値が存在すれば採用し、sum に加算する。
// - 存在せず 2 行目以降なら、前行の同口座の値を引き継ぐ（前行も null なら null）。
// - 存在せず初回行なら null（引き継ぐ前行が無い）。
// - 全口座が null（＝ sum === 0）なら sum を null にして「-」表示にする。
// snapshots は createdAt でグループ化済み・昇順で渡す（前行依存のため昇順必須）。

// 表示順を固定するため配列で受ける。
export type BankColumn = {
  id: Id;
  name: string;
};

// ある記録日の残高スナップショット。
// その日に登録が無い口座は key を持たない（＝前行引き継ぎ / null 判定の対象）。
export type BalanceSnapshot = {
  createdAt: Date | string;
  // bankId(文字列) → price。
  prices: Record<string, number>;
};

// bankPrices は banks と同じ並び（null は未登録＝「-」表示）。
export type TableRow = {
  createdDate: string;
  bankPrices: (number | null)[];
  sum: number | null;
};

// banks の並びが列順、snapshots の並びが行順（昇順）。
export function buildBalanceTable(
  banks: BankColumn[],
  snapshots: BalanceSnapshot[]
): TableRow[] {
  const rows: TableRow[] = [];

  snapshots.forEach((snapshot, rowIndex) => {
    const bankPrices: (number | null)[] = [];
    let sum = 0;

    banks.forEach((bank, bankIndex) => {
      const key = String(bank.id);
      if (key in snapshot.prices) {
        const price = snapshot.prices[key];
        bankPrices.push(price);
        sum += price;
        return;
      }

      if (rowIndex > 0) {
        // 前行の同口座値を引き継ぐ（前行も null なら null）。
        const previous = rows[rowIndex - 1].bankPrices[bankIndex];
        if (previous !== null) {
          bankPrices.push(previous);
          sum += previous;
          return;
        }
        bankPrices.push(null);
        return;
      }

      // 初回行で登録が無ければ引き継ぐ前行が無いため null。
      bankPrices.push(null);
    });

    rows.push({
      createdDate: toDateStringJst(snapshot.createdAt),
      bankPrices,
      // 全口座 null（合計 0）は「未登録の行」を意味するため null 表示にする。
      sum: sum === 0 ? null : sum
    });
  });

  return rows;
}
