import { type User } from 'firebase/auth';

export const useUserStore = defineStore(
  'userStore',
  () => {
    // state
    const state = ref<{ userUid: string | null }>({ userUid: null });

    // getters
    const userUid = computed(() => {
      if (state.value.userUid === null) throw new Error('unsigned user');
      else return state.value.userUid;
    });

    // setters
    function setUser(user: User | null) {
      state.value.userUid = user?.uid ?? null;
    }

    return {
      _: state, // get しないプロパティだが、永続化するために属性を追加する
      userUid,
      setUser,
    };
  },
  {
    persist: {
      storage: persistedState.localStorage,
    },
  }
);
