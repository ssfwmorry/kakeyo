// フロント側ではprocess.envからの参照が不可、かつ、本ファイル内ではuseRuntimeConfigが使用不可である
// 引数に与えることで、環境変数を使えるようにする
import type { RuntimeConfig } from 'nuxt/schema';
// 直接 demoApi.ts から import すると 'implicitly has type any' エラーがでる。そのため本ファイルからexportする
import DEMO_DATA from '@/utils/constants/demoApi';

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
    PAIR_ID: 2, // TODO: publicのDBデータに依存するように
    NOW_DATE: '2022-01-13',
    NOW_YEAR: 2022,
    UID: config.public.demoUserUid,
  };
};

const PAGE = {
  BANK: 'bank',
  CALENDAR: 'calendar',
  INDEX: 'index',
  INQUIRY: 'inquiry',
  LOGIN: 'login',
  NOTE: 'note',
  PLAN: 'plan',
  RECORDS: 'records',
  SUMMARY: 'summary',
  SETTING: 'setting',
} as const;

const EMAIL_WHITE_LIST = (config: RuntimeConfig) => {
  switch (config.public.supabaseSchema) {
    case DbSchema.develop:
      return [config.public.testUserDev1, config.public.testUserDev2, config.public.testUserDev3];
    case DbSchema.public:
      return [config.public.demoUserPairEmail, config.public.testUserPub1];
    default:
      return [];
  }
};

export const SettlementRecord = {
  name: '精算',
  /** 'yellow'は、SummaryPieでのグラフと、VuetifyのColorのどちらも同じ文字列で対応できている */
  color: 'yellow',
} as const;

export { APP_NAME, DEMO_DATA, DEMO_USER_INFO, EMAIL_WHITE_LIST, MAX_PRICE, PAGE };
