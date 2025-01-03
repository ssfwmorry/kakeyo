import { EMAIL_WHITE_LIST } from '@/constants';
import type { RouteParamsRaw } from 'vue-router';
import { boolStr } from '~/types/common';
const config = useRuntimeConfig();

const IsNotUndefined = function (obj: any) {
  return typeof obj !== 'undefined';
};

const IsValidObj = function (obj: any) {
  return typeof obj !== 'undefined' && obj !== null && Object.keys(obj).length > 0;
};

const IsValidKey = function (obj: any, key: string) {
  return obj !== null && key in obj;
};

// keyがあり、valueが有効なObjかどうか
const IsValidKeyValue = function (obj: any, key: string) {
  return obj !== null && key in obj && typeof obj[key] !== 'undefined' && obj[key] !== null;
};

const IsInWhiteList = function (email: string) {
  for (const e of EMAIL_WHITE_LIST(config)) {
    if (e === email) return true;
  }
  return false;
};

const convertRouteParamsRaw = function (obj: Record<string, any>): RouteParamsRaw {
  const ret: RouteParamsRaw = {};
  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    const type = typeof value;
    if (value === null || ['number', 'string'].includes(type)) {
      ret[key] = value;
    } else if (type === 'boolean') {
      ret[key] = value ? boolStr.TRUE : boolStr.FALSE;
    } else {
      throw new Error('convertRouteParamsRaw');
    }
  });

  return ret;
};

export {
  IsNotUndefined,
  IsValidObj,
  IsValidKey,
  IsValidKeyValue,
  IsInWhiteList,
  convertRouteParamsRaw,
};
