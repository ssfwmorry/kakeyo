import { EMAIL_WHITE_LIST } from '~/utils/constants';
const config = useRuntimeConfig();

export const IsInWhiteList = function (email: string) {
  for (const e of EMAIL_WHITE_LIST(config)) {
    if (e === email) return true;
  }
  return false;
};

// 万を単位として少数第一位まで
export const ConvertManUnit = (num: number) => {
  return Math.round(num / 1000) / 10;
};
