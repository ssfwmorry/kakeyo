import { page } from '@/types/common';
const OKPageList = [page.INQUIRY, page.LOGIN] as string[];

export default defineNuxtRouteMiddleware((to, from) => {
  const loginStore = useLoginStore();
  const { isLoggedIn } = storeToRefs(loginStore);

  if (isLoggedIn.value) {
    // ログイン画面を拒否
    if (to.name === page.LOGIN) {
      return navigateTo(`/${page.NOTE}`);
    }
    if (to.name === page.INDEX) {
      return navigateTo(`/${page.CALENDAR}`);
    }
  } else {
    // ログイン前は、限られた page のみアクセス可能
    if (!OKPageList.includes(to.name?.toString() ?? '')) {
      return navigateTo(`/${page.LOGIN}`);
    }
  }
});
