import { describe, expect, it } from 'vitest';
import { foldTypeSummary, type TypeSummaryFoldRow } from './type-summary';

// get_type_summary 横長行 → TypeSummaryItem[] 畳み込みの Vitest。
// server-only を含まない純粋関数のみ対象。

function row(over: Partial<TypeSummaryFoldRow>): TypeSummaryFoldRow {
  return {
    typeId: 1,
    typeName: '食費',
    isPair: false,
    subTypeId: null,
    subTypeName: null,
    colorName: 'orange',
    subTypeSum: 0,
    sum: 100,
    ...over
  };
}

describe('foldTypeSummary', () => {
  it('(a) 同一 typeId の複数 sub_type 行を 1 item に畳み込む', () => {
    const items = foldTypeSummary([
      row({
        typeId: 1,
        subTypeId: 11,
        subTypeName: '外食',
        subTypeSum: 60,
        sum: 100
      }),
      row({
        typeId: 1,
        subTypeId: 12,
        subTypeName: '食料品',
        subTypeSum: 40,
        sum: 100
      })
    ]);
    expect(items).toHaveLength(1);
    expect(items[0].typeId).toBe(1);
    expect(items[0].sum).toBe(100);
    expect(items[0].subTypes).toEqual([
      { subTypeId: 11, subTypeName: '外食', subTypeSum: 60 },
      { subTypeId: 12, subTypeName: '食料品', subTypeSum: 40 }
    ]);
  });

  it('(b) sub_type が無い行（id/name null）は subTypes 空のまま', () => {
    const items = foldTypeSummary([
      row({ typeId: 2, typeName: '交通費', sum: 50 })
    ]);
    expect(items[0].subTypes).toEqual([]);
  });

  it('(c) subTypeSum===0 の行は nest しない（旧 FE 踏襲）', () => {
    const items = foldTypeSummary([
      row({
        typeId: 3,
        subTypeId: 31,
        subTypeName: 'ゼロ',
        subTypeSum: 0,
        sum: 0
      })
    ]);
    expect(items[0].subTypes).toEqual([]);
  });

  it('(d) typeId=null（精算）は 1 グループにまとまる', () => {
    const items = foldTypeSummary([
      row({ typeId: null, typeName: null, colorName: null, sum: 200 }),
      row({ typeId: null, typeName: null, colorName: null, sum: 200 })
    ]);
    expect(items).toHaveLength(1);
    expect(items[0].typeId).toBeNull();
    expect(items[0].colorName).toBeNull();
    expect(items[0].sum).toBe(200);
  });

  it('(e) 複数 type の出現順を保持する', () => {
    const items = foldTypeSummary([
      row({ typeId: 5, typeName: 'A', sum: 300 }),
      row({ typeId: 6, typeName: 'B', sum: 200 }),
      row({
        typeId: 5,
        typeName: 'A',
        subTypeId: 51,
        subTypeName: 'a',
        subTypeSum: 300,
        sum: 300
      })
    ]);
    expect(items.map((i) => i.typeId)).toEqual([5, 6]);
    expect(items[0].subTypes).toHaveLength(1);
  });
});
