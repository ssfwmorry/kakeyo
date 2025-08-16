<template>
  <div class="h-100">
    <LazyLoading v-show="loading" />
    <div v-if="isDemoLogin" class="demo-label">デモ用</div>
    <v-navigation-drawer
      v-model="drawer"
      app
      fixed
      temporary
      touchless
      disable-route-watcher
      color="grey-darken-3"
      width="200"
    >
      <v-list>
        <v-list-item disabled>
          {{ APP_NAME }}
        </v-list-item>
        <!--
          ログイン後: ログアウトのみ非表示に
          ログイン前かつ login 画面: login 画面で非表示にすべきではないもののみ表示
          ログイン前かつ login 画面以外: ログイン前で表示すべきものを表示
          -->
        <v-list-item v-for="(item, i) in sideBarItems" :key="i" exact @click="clickSideBar(item)">
          <template v-slot:prepend>
            <v-icon :icon="item.icon"></v-icon>
          </template>
          <v-list-item-title>
            {{ item.name }}
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
    <v-app-bar flat absolute color="grey-lighten-4" height="40" class="mx-auto app-bar-padding">
      <div class="app-bar-content">
        <v-app-bar-nav-icon @click.stop="drawer = !drawer" />
      </div>
      <div v-if="isLoggedIn" class="ml-1">
        <AppBarInfoIcon />
      </div>
      <v-spacer />
      <div v-if="isLoggedIn && isExistPair && !pagesWithoutPair.includes($route.name as string)">
        <v-switch
          v-model="isPair"
          hide-details
          color="primary"
          density="compact"
          :true-value="true"
          :false-value="false"
          :class="{ 'mr-60px': isDemoLogin }"
        >
          <template v-slot:label>
            <v-icon size="large">{{ $ICONS.SHARE }}</v-icon>
          </template>
        </v-switch>
      </div>
    </v-app-bar>
    <v-main class="bg-geometric-pattern p-footer h-100">
      <v-container class="page-container pa-0">
        <slot />
      </v-container>
    </v-main>
    <v-snackbar v-model="isShowToast" app :transition="false" :color="toast.color">
      {{ toast.message }}
      <template v-slot:actions>
        <v-btn variant="text" @click="isShowToast = false">閉じる</v-btn>
      </template>
    </v-snackbar>
    <v-footer v-show="isLoggedIn" app color="blue-grey-darken-2" class="pa-0">
      <v-tabs
        stacked
        fixed-tabs
        :show-arrows="false"
        align-tabs="center"
        :hide-slider="true"
        height="80"
        class="w-100"
      >
        <!-- todo toが同じ場合リダイレクト -->
        <v-tab
          v-for="(tabItem, i) in tabItems"
          :key="i"
          :to="tabItem.to"
          class="tab-item d-flex flex-column"
        >
          <template v-if="tabItem.isBig">
            <v-icon class="note-icon">{{ tabItem.icon }}</v-icon>
          </template>
          <template v-else class="">
            <v-icon>{{ tabItem.icon }}</v-icon>
            <span class="fs-sm">{{ tabItem.name }}</span>
          </template>
        </v-tab>
      </v-tabs>
    </v-footer>
  </div>
</template>

<script setup lang="ts">
import { APP_NAME, PAGE } from '~/utils/constants';

type PageItem = {
  icon: string;
  name: string;
  to: string;
};

const { signOut } = useFirebase();
const loadingStore = useLoadingStore();
const { loading } = storeToRefs(loadingStore);
const authStore = useAuthStore();
const { isExistPair, isLoggedIn, isDemoLogin } = storeToRefs(authStore);
const { setLogout } = useAuthStore();
const { $ICONS } = useNuxtApp();
const pairStore = usePairStore();
const { isPair: isPairStore } = storeToRefs(pairStore);
const { setIsPair } = usePairStore();
const route = useRoute();
const router = useRouter();
const { toast, setToast } = useToastStore();

const tabItems = [
  {
    isBig: false,
    name: 'カレンダー',
    icon: $ICONS.CALENDAR,
    to: '/calendar',
  },
  {
    isBig: false,
    name: '集計',
    icon: $ICONS.ANALYTICS,
    to: '/summary',
  },
  {
    isBig: true,
    name: '入力',
    icon: $ICONS.PLUS_BOX,
    to: '/note',
  },
  {
    isBig: false,
    name: '口座',
    icon: $ICONS.PIGGY_BANK,
    to: '/bank',
  },
  {
    isBig: false,
    name: '設定',
    icon: $ICONS.COG,
    to: '/setting',
  },
];

const pagesWithoutPair = ['calendar', 'records', 'bank'];

const drawer = ref(false);

// https://blog.cloud-acct.com/posts/u-nuxt-grobal-toaster
const isShowToast = computed({
  get: () => {
    return !!toast.message;
  },
  set: (val) => {
    setToast('');
    return val;
  },
});

const isPair = computed({
  get: () => {
    return isPairStore.value;
  },
  set: (val) => {
    setIsPair(val);
    return val;
  },
});

const sideBarItems = computed((): PageItem[] => {
  const loginItem = {
    icon: $ICONS.LOGIN,
    name: 'ログイン',
    to: '/login',
  };
  const inquiryItem = {
    icon: $ICONS.PHONE,
    name: '問い合わせ',
    to: '/inquiry',
  };
  const logoutItem = {
    icon: $ICONS.LOGOUT,
    name: 'ログアウト',
    to: '/',
  };

  if (isLoggedIn.value) {
    return [inquiryItem, logoutItem];
  } else {
    if (route.name === 'login') {
      return [inquiryItem];
    } else {
      return [inquiryItem, loginItem];
    }
  }
});

const clickSideBar = async (item: PageItem) => {
  if (item.name === 'ログアウト') {
    await logOut();
  } else {
    router.push(item.to);
    drawer.value = false;
  }
};
const logOut = async () => {
  await signOut();
  setLogout();
  router.push({
    name: PAGE.LOGIN,
  });
  drawer.value = false;
};
</script>

<style lang="scss" scoped>
// ヘッダ
:deep(.app-bar-padding .v-toolbar__content) {
  padding-left: 5px;
  padding-right: 5px;
}
// デモ表示
.demo-label {
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  width: 3.5rem;
  height: 40px;
  background-color: red;
  color: white;
  top: 0;
  right: 0;
  z-index: $zindex-demo-label;
}
.mr-60px {
  margin-right: 60px;
}
// 背景
// https://freefrontend.com/css-background-patterns/
// Author: Webstoryboy, December 22, 2018
.bg-geometric-pattern {
  background: radial-gradient(lightsteelblue 3px, transparent 4px),
    radial-gradient(lightsteelblue 3px, transparent 4px), linear-gradient(#fff 4px, transparent 0),
    linear-gradient(
      45deg,
      transparent 74px,
      transparent 75px,
      #a4a4a4 75px,
      #a4a4a4 76px,
      transparent 77px,
      transparent 109px
    ),
    linear-gradient(
      -45deg,
      transparent 75px,
      transparent 76px,
      #a4a4a4 76px,
      #a4a4a4 77px,
      transparent 78px,
      transparent 109px
    ),
    #fff;
  background-size: 109px 109px, 109px 109px, 100% 6px, 109px 109px, 109px 109px;
  background-position: 54px 55px, 0px 0px, 0px 0px, 0px 0px, 0px 0px;
}
.p-footer {
  padding-bottom: $footer-height !important;
}

// トースト
:deep(.v-snackbar__wrapper) {
  width: 90% !important;
  max-width: calc(#{$breakpoint-xs}* 0.9);
  min-width: 0;
}
// フッタ
.tab-item {
  width: 20% !important;
  max-width: inherit !important;
  min-width: 30px !important;
  margin: 0 !important;
  padding: 0 0 12px 0 !important;
}
:deep(.v-slide-group__prev),
:deep(.v-slide-group__next) {
  display: none !important;
}
.note-icon {
  font-size: 2.6rem;
}
</style>
