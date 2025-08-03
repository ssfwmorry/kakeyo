import { PAGE } from '~/utils/constants';

const OKPageList = [PAGE.INQUIRY, PAGE.LOGIN] as string[];

export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore();
  const { isLoggedIn } = storeToRefs(authStore);

  if (isLoggedIn.value) {
    // ログイン画面を拒否
    if (to.name === PAGE.LOGIN) {
      return navigateTo(`/${PAGE.NOTE}`);
    }
    if (to.name === PAGE.INDEX) {
      return navigateTo(`/${PAGE.CALENDAR}`);
    }
  } else {
    // ログイン前は、限られた PAGE のみアクセス可能
    if (!OKPageList.includes(to.name?.toString() ?? '')) {
      return navigateTo(`/${PAGE.LOGIN}`);
    }
  }
});
