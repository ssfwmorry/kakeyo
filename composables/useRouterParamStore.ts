import type { Plan, Record_, RouterParamKey } from '~/types/common';

export const useRouterParamStore = defineStore('RouterParamStore', () => {
  // state
  const state = ref<Record<RouterParamKey, Record_ | Plan | null>>({
    PLANNED_RECORD: null,
    RECORD: null,
    PLAN: null,
  });

  // getters
  function routerParam(key: RouterParamKey): Record_ | Plan | null {
    return state.value[key];
  }

  // setters
  function setRouterParam(key: RouterParamKey, value: Record_ | Plan) {
    state.value[key] = value;
  }

  return {
    _: state, // get しないプロパティだが、永続化するために属性を追加する
    routerParam,
    setRouterParam,
  };
});
