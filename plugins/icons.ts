import {
  mdiAccountMultiple,
  mdiArrowBottomLeft,
  mdiArrowDown,
  mdiArrowRight,
  mdiArrowUp,
  mdiBackspaceOutline,
  mdiCalendar,
  mdiCashMultiple,
  mdiChartBar,
  mdiChartPie,
  mdiCheck,
  mdiClose,
  mdiCog,
  mdiCreditCardOutline,
  mdiEye,
  mdiEyeOff,
  mdiFolder,
  mdiGoogleAnalytics,
  mdiLabel,
  mdiLogin,
  mdiLogout,
  mdiPencil,
  mdiPlus,
  mdiPhone,
  mdiPiggyBank,
  mdiPlusBox,
  mdiSwapVertical,
  mdiTrashCanOutline,
  mdiUpdate,
} from '@mdi/js';

const ICONS = {
  ANALYTICS: mdiGoogleAnalytics,
  ARROW_BOTTOM_LEFT: mdiArrowBottomLeft,
  ARROW_DOWN: mdiArrowDown,
  ARROW_RIGHT: mdiArrowRight,
  ARROW_UP: mdiArrowUp,
  BACKSPACE: mdiBackspaceOutline,
  CASH: mdiCashMultiple,
  CHART_BAR: mdiChartBar,
  CHART_PIE: mdiChartPie,
  CALENDAR: mdiCalendar,
  COG: mdiCog,
  CHECK: mdiCheck,
  CLOSE: mdiClose,
  CREDIT_CARD: mdiCreditCardOutline,
  EYE: mdiEye,
  EYE_OFF: mdiEyeOff,
  FOLDER: mdiFolder,
  LABEL: mdiLabel,
  LOGIN: mdiLogin,
  LOGOUT: mdiLogout,
  PENCIL: mdiPencil,
  PLUS: mdiPlus,
  PHONE: mdiPhone,
  PIGGY_BANK: mdiPiggyBank,
  PLUS_BOX: mdiPlusBox,
  SHARE: mdiAccountMultiple,
  SWAP_VERTICAL: mdiSwapVertical,
  TRASH: mdiTrashCanOutline,
  UPDATE: mdiUpdate,
};

export default defineNuxtPlugin((nuxtApp) => {
  return {
    provide: { ICONS },
  };
});
