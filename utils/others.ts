import { EMAIL_WHITE_LIST } from '@/utils/constants';
const config = useRuntimeConfig();

// keyがあり、valueが有効なObjかどうか
export const IsValidKeyValue = function (obj: any, key: string) {
  return obj !== null && key in obj && typeof obj[key] !== 'undefined' && obj[key] !== null;
};

export const IsInWhiteList = function (email: string) {
  for (const e of EMAIL_WHITE_LIST(config)) {
    if (e === email) return true;
  }
  return false;
};
