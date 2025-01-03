const LoginStatus = {
  BeforeLogin: 0,
  DemoLogin: 1,
  UserLogin: 2,
} as const;
type LoginStatus = (typeof LoginStatus)[keyof typeof LoginStatus];

export const useLoginStore = defineStore(
  'loginStore',
  () => {
    // state
    const state = ref<LoginStatus>(LoginStatus.BeforeLogin);

    // getters
    const isLoggedIn = computed(() => state.value !== LoginStatus.BeforeLogin);
    const isDemoLogin = computed(() => state.value === LoginStatus.DemoLogin);
    const isUserLogin = computed(() => state.value === LoginStatus.UserLogin);

    // setters
    function setLogout() {
      state.value = LoginStatus.BeforeLogin;
    }
    function setDemoLogin() {
      state.value = LoginStatus.DemoLogin;
    }
    function setUserLogin() {
      state.value = LoginStatus.UserLogin;
    }

    return {
      _: state, // get しないプロパティだが、永続化するために属性を追加する
      isLoggedIn,
      isDemoLogin,
      isUserLogin,
      setLogout,
      setDemoLogin,
      setUserLogin,
    };
  },
  {
    persist: {
      storage: persistedState.localStorage,
    },
  }
);
