import type { Id } from '@/lib/shared/types/id';

// 内訳一覧「＞」→ /records 遷移のクエリ組み立て/読み取り（旧 RECORDS_QUERY_PARAM を
// URL 検索パラメータに載せ替えたもの・方針書 §8: useRouterParamStore 廃止）。
// server-only を含まない純粋関数 = Client / records ページ双方から使う。

// records 明細画面が必要とする全パラメータ（get_summarized_record_list の input +
// ヘッダ表示用の name/color/pairUserName）。
export type RecordsQuery = {
  id: Id;
  subTypeId: Id | null;
  isPay: boolean;
  isType: boolean;
  isPair: boolean;
  isIncludeInstead: boolean;
  // 'YYYY-MM'。
  yearMonth: string;
  name: string;
  // Vuetify 色トークン名。
  colorName: string;
  pairUserName: string | null;
};

// RecordsQuery → URLSearchParams（/records?... へ渡す）。
export function toRecordsSearchParams(query: RecordsQuery): URLSearchParams {
  const params = new URLSearchParams();
  params.set('id', String(query.id));
  if (query.subTypeId !== null) {
    params.set('subTypeId', String(query.subTypeId));
  }
  params.set('isPay', String(query.isPay));
  params.set('isType', String(query.isType));
  params.set('isPair', String(query.isPair));
  params.set('isIncludeInstead', String(query.isIncludeInstead));
  params.set('yearMonth', query.yearMonth);
  params.set('name', query.name);
  params.set('colorName', query.colorName);
  if (query.pairUserName !== null) {
    params.set('pairUserName', query.pairUserName);
  }
  return params;
}

// URL 検索パラメータ → RecordsQuery（必須欠落は null で返し、呼び出し側が summary へ戻す）。
export function fromRecordsSearchParams(
  sp: Record<string, string | string[] | undefined>
): RecordsQuery | null {
  const idRaw = single(sp.id);
  const yearMonth = single(sp.yearMonth);
  if (idRaw === undefined || yearMonth === undefined) {
    return null;
  }
  const id = Number(idRaw);
  if (!Number.isInteger(id)) {
    return null;
  }
  if (!/^\d{4}-\d{2}$/.test(yearMonth)) {
    return null;
  }
  const subTypeRaw = single(sp.subTypeId);
  const subTypeId =
    subTypeRaw !== undefined && Number.isInteger(Number(subTypeRaw))
      ? Number(subTypeRaw)
      : null;

  return {
    id,
    subTypeId,
    isPay: single(sp.isPay) === 'true',
    isType: single(sp.isType) === 'true',
    isPair: single(sp.isPair) === 'true',
    isIncludeInstead: single(sp.isIncludeInstead) === 'true',
    yearMonth,
    name: single(sp.name) ?? '',
    colorName: single(sp.colorName) ?? 'black',
    pairUserName: single(sp.pairUserName) ?? null
  };
}

function single(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}
