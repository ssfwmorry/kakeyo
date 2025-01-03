export const useLoadingStore = defineStore(
  'loadingStore',
  () => {
    // state
    const state = ref(false);

    // getters
    const loading = computed(() => state.value);

    // setters
    function enableLoading() {
      state.value = true;
    }
    function disableLoading() {
      state.value = false;
    }

    return { loading, enableLoading, disableLoading };
  },
  {
    persist: {
      storage: persistedState.localStorage,
    },
  }
);
