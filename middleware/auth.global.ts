import { LOCAL_STORAGE_KEY } from '@/constants';
const OKPageList = ['login', 'inqury'];

export default defineNuxtRouteMiddleware((to, from) => {
  const loginStore = useLoginStore();
  const { isLoggedIn } = storeToRefs(loginStore);

  if (isLoggedIn.value) {
    // ログイン画面を拒否
    if (to.name === 'login') {
      return navigateTo('/note');
    }
    if (to.name === 'index') {
      const isCalendarPageMain =
        localStorage.getItem(LOCAL_STORAGE_KEY.IS_CALENDAR_PAGE_MAIN) === 'false' ? false : true;
      return navigateTo(isCalendarPageMain ? '/calendar' : '/note');
    }
  } else {
    // ログイン前は、限られた page のみアクセス可能
    if (!OKPageList.includes(to.name?.toString() ?? '')) {
      return navigateTo('/login');
    }
  }
});
