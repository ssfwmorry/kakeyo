export const usePairStore = defineStore(
  'pairStore',
  () => {
    // state
    const state = ref<boolean>(false);

    // getters
    const isPair = computed(() => state.value);

    // setters
    function setIsPair(isPair: boolean) {
      state.value = isPair;
    }

    return {
      _: state, // get しないプロパティだが、永続化するために属性を追加する
      isPair,
      setIsPair,
    };
  },
  {
    persist: {
      storage: persistedState.localStorage,
    },
  }
);
