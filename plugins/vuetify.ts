import '@mdi/font/css/materialdesignicons.css';

import '@/assets/common.scss';
import DayJsAdapter from '@date-io/dayjs';
import ja from 'dayjs/locale/ja';
import { createVuetify } from 'vuetify';
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg';
import { ja as vuetifyJa } from 'vuetify/locale';
import 'vuetify/styles';
import colors from 'vuetify/util/colors';

export default defineNuxtPlugin((app) => {
  const vuetify = createVuetify({
    icons: {
      defaultSet: 'mdi',
      aliases,
      sets: {
        mdi,
      },
    },
    date: {
      adapter: DayJsAdapter,
      locale: { ja },
    },
    locale: {
      fallback: 'en',
      locale: 'ja',
      messages: {
        ja: {
          ...vuetifyJa,
          close: '閉じる', // v-chip の$vuetify.close
        },
      },
    },
    ssr: false,
    theme: {
      themes: {
        light: {
          dark: false,
          colors: {
            primary: colors.blue.darken2,
            accent: colors.grey.darken3,
            secondary: colors.amber.darken3,
            info: colors.teal.lighten1,
            warning: colors.amber.base,
            error: colors.deepOrange.accent4,
            success: colors.green.accent3,
          },
        },
      },
    },
  });

  app.vueApp.use(vuetify);
});
