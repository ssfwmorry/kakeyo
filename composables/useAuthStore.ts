import type { Id } from '@/utils/types/common';
import type { User } from 'firebase/auth';

const LoginStatus = {
  BeforeLogin: 0,
  DemoLogin: 1,
  UserLogin: 2,
} as const;
type LoginStatus = (typeof LoginStatus)[keyof typeof LoginStatus];

export const useAuthStore = defineStore(
  'authStore',
  () => {
    // state
    const loginState = ref<LoginStatus>(LoginStatus.BeforeLogin);
    const userState = ref<{ userUid: string | null; pairId: Id | null }>({
      userUid: null,
      pairId: null,
    });

    // getters
    const isLoggedIn = computed(() => loginState.value !== LoginStatus.BeforeLogin);
    const isDemoLogin = computed(() => loginState.value === LoginStatus.DemoLogin);
    const isUserLogin = computed(() => loginState.value === LoginStatus.UserLogin);

    const userUid = computed(() => {
      if (userState.value.userUid === null) throw new Error('unsigned user');
      else return userState.value.userUid;
    });
    const pairId = computed(() => userState.value.pairId);
    const isExistPair = computed(() => !!userState.value.pairId);

    // setters
    function setLogout() {
      loginState.value = LoginStatus.BeforeLogin;
    }
    function setDemoLogin() {
      loginState.value = LoginStatus.DemoLogin;
    }
    function setUserLogin() {
      loginState.value = LoginStatus.UserLogin;
    }
    function setUserInfo(user: User | null, pairId: Id | null) {
      userState.value.userUid = user?.uid ?? null;
      userState.value.pairId = pairId;
    }

    return {
      // get しないプロパティだが、永続化するために属性を追加する
      _: loginState,
      __: userState,
      isLoggedIn,
      isDemoLogin,
      isUserLogin,
      userUid,
      pairId,
      isExistPair,
      setLogout,
      setDemoLogin,
      setUserLogin,
      setUserInfo,
    };
  },
  {
    persist: {
      storage: persistedState.localStorage,
    },
  }
);
