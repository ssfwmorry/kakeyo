import type { Plan, Record_ } from '@/utils/types/common';
import type {
  PlannedRecordViaPage,
  RecordsQueryParam,
  RouterParamKey,
  SummaryQueryParam,
} from '@/utils/types/page';

type RouterParam = Record_ | Plan | PlannedRecordViaPage | RecordsQueryParam | SummaryQueryParam;

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
  function routerParam(key: RouterParamKey): RouterParam | null {
    return state.value[key];
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
