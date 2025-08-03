import { defineNuxtConfig } from 'nuxt/config';
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify';

/**
 * アルファベット順に記載
 */
export default defineNuxtConfig({
  app: {
    head: {
      meta: [
        { name: 'theme-color', content: '#000' },
        { name: 'robots', content: 'noindex' },
      ],
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
    },
  },
  build: {
    transpile: ['vuetify'],
  },

  // css: ['~/assets/common.scss'], // npm run dev では common.scss の中身が呼ばれない
  devtools: { enabled: true },
  modules: [
    '@pinia/nuxt',
    '@pinia-plugin-persistedstate/nuxt',
    '@vite-pwa/nuxt',
    (_options, nuxt) => {
      nuxt.hooks.hook('vite:extendConfig', (config) => {
        // @ts-expect-error
        config.plugins.push(vuetify({ autoImport: true }));
      });
    },
  ],
  pwa: {
    devOptions: { enabled: false },
    includeAssets: ['favicon.ico', 'pwa-icon.png'],
    manifest: {
      background_color: '#000',
      description: '',
      display: 'standalone',
      icons: [{ src: 'pwa-icon.png', type: 'image/png' }],
      lang: 'ja',
      name: 'かけよ',
      short_name: 'かけよ',
      start_url: '/',
      theme_color: '#000',
    },
    registerType: 'autoUpdate',
    workbox: { navigateFallback: null },
  },
  runtimeConfig: {
    public: {
      firebaseApiKey: process.env.NUXT_PUBLIC_FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.NUXT_PUBLIC_FIREBASE_AUTH_ADMIN,
      firebaseDatabaseURL: process.env.NUXT_PUBLIC_FIREBASE_DATABASE_URL,
      firebaseProjectId: process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.NUXT_PUBLIC_FIREBASE_APP_ID,
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY,
      demoUserEmail: process.env.NUXT_PUBLIC_DEMO_USER_EMAIL,
      demoUserPassword: process.env.NUXT_PUBLIC_DEMO_USER_PASSWORD,
      demoUserUid: process.env.NUXT_PUBLIC_DEMO_USER_UID,
      demoUserPairEmail: process.env.NUXT_PUBLIC_DEMO_USER_PAIR_EMAIL,
      demoUserPairPassword: process.env.NUXT_PUBLIC_DEMO_USER_PAIR_PASSWORD,
      demoUserPairUid: process.env.NUXT_PUBLIC_DEMO_USER_PAIR_UID,
      testUserPub1: process.env.NUXT_PUBLIC_TEST_USER_PUB1,
      testUserDev1: process.env.NUXT_PUBLIC_TEST_USER_DEV1,
      testUserDev2: process.env.NUXT_PUBLIC_TEST_USER_DEV2,
      testUserDev3: process.env.NUXT_PUBLIC_TEST_USER_DEV3,
      supabaseSchema: process.env.NUXT_PUBLIC_SUPABASE_SCHEMA,
    },
  },
  ssr: false,
  typescript: {
    shim: false,
    strict: true,
    typeCheck: true,
  },
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "@/assets/variables.scss" as *;',
        },
      },
    },
    vue: {
      template: {
        transformAssetUrls,
      },
    },
  },
});
