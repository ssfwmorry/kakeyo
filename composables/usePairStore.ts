import type { Id } from '@/utils/types/common';

export const usePairStore = defineStore(
  'pairStore',
  () => {
    // state
    const state = ref<{ pairId: Id | null; isPair: boolean }>({ pairId: null, isPair: false });

    // getters
    const pairId = computed(() => state.value.pairId);
    const isExistPair = computed(() => !!state.value.pairId);
    const isPair = computed(() => state.value.isPair);

    // setters
    function setPairId(pairId: Id | null) {
      state.value.pairId = pairId;
    }
    function setIsPair(isPair: boolean) {
      state.value.isPair = isPair;
    }

    return {
      _: state, // get しないプロパティだが、永続化するために属性を追加する
      pairId,
      isExistPair,
      isPair,
      setPairId,
      setIsPair,
    };
  },
  {
    persist: {
      storage: persistedState.localStorage,
    },
  }
);
