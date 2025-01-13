// フロント側ではprocess.envからの参照が不可、かつ、本ファイル内ではuseRuntimeConfigが使用不可である
// 引数に与えることで、環境変数を使えるようにする
import type { RuntimeConfig } from 'nuxt/schema';
// 直接 demoApi.ts から import すると 'implicitly has type any' エラーがでる。そのため本ファイルからexportする
import DEMO_DATA from '@/constants/demoApi';

const DbSchema = {
  develop: 'develop',
  public: 'public',
} as const;
type DbSchema = (typeof DbSchema)[keyof typeof DbSchema];

const APP_NAME = 'かけよ';
const MAX_PRICE = 10000000;

const DEMO_USER_INFO = (config: RuntimeConfig) => {
  return {
    EMAIL: config.public.demoUserEmail,
    PASSWORD: config.public.demoUserPassword,
    ID: -1,
    NOW_DATE: '2022-01-13',
    NOW_YEAR: 2022,
    UID: config.public.demoUserUid,
  };
};

const COLOR_LIST = [
  'red', // 0
  'pink',
  'purple',
  'deep-purple',
  'indigo',
  'blue', // 5
  'light-blue',
  'cyan',
  'teal',
  'green',
  'light-green', //10
  'lime',
  'amber',
  'orange',
  'brown',
  'blue-grey', //15
  'grey',
  'black',
];

const RATE_LIST = [1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1, 0];
const RATE_LABEL_LIST = ['10：0', '9：1', '8：2','7：3', '6：4', '割り勘', '4：6', '3：7','2：8', '1：9', '0：10']; // prettier-ignore
const RATE_COLOR_LIST = ['red-accent-4','red-accent-3','red-accent-2','red-accent-1','red-lighten-3','purple lighten-2','blue-lighten-3','blue-accent-1','blue-accent-2','blue-accent-3','blue-accent-4']; // prettier-ignore
const RATE_BACKGROUND_COLOR_LIST = ['red-lighten-3','red-lighten-3','red-lighten-3','red-lighten-4','red-lighten-5','purple lighten-5','blue-lighten-5','blue-lighten-4','blue-lighten-3','blue-lighten-3','blue-lighten-3'] // prettier-ignore

const EMAIL_WHITE_LIST = (config: RuntimeConfig) => {
  switch (config.public.supabaseSchema) {
    case DbSchema.develop:
      return [config.public.testUserDev1, config.public.testUserDev2, config.public.testUserDev3];
    case DbSchema.public:
      return [config.public.testUserPub1];
    default:
      return [];
  }
};

export {
  APP_NAME,
  COLOR_LIST,
  DEMO_DATA,
  DEMO_USER_INFO,
  EMAIL_WHITE_LIST,
  MAX_PRICE,
  RATE_LIST,
  RATE_LABEL_LIST,
  RATE_COLOR_LIST,
  RATE_BACKGROUND_COLOR_LIST,
};
