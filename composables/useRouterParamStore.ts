import type {
  Plan,
  PlannedRecord,
  Record_,
  RecordsQueryParam,
  RouterParamKey,
  SummaryQueryParam,
} from '~/utils/types/page';

type RouterParam = Record_ | Plan | PlannedRecord | RecordsQueryParam | SummaryQueryParam;

export const useRouterParamStore = defineStore('RouterParamStore', () => {
  // state
  const state = ref<Record<RouterParamKey, RouterParam | null>>({
    PLANNED_RECORD: null,
    RECORD: null,
    PLAN: null,
    RECORDS_QUERY_PARAM: null,
    SUMMARY_QUERY_PARAM: null,
  });

  // getters
  function routerParam<T extends RouterParam>(key: RouterParamKey): T | null {
    return state.value[key] as T | null;
  }

  // setters
  function setRouterParam(key: RouterParamKey, value: RouterParam | null) {
    state.value[key] = value;
  }

  return {
    _: state, // get しないプロパティだが、永続化するために属性を追加する
    routerParam,
    setRouterParam,
  };
});
