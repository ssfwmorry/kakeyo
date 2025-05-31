export const COLOR_CODE = {
  ['red']: '#f44336',
  ['pink']: '#e91e63',
  ['purple']: '#9c27b0',
  ['deep-purple']: '#673ab7',
  ['indigo']: '#3f51b5',
  ['blue']: '#2196f3',
  ['light-blue']: '#03a9f4',
  ['cyan']: '#00bcd4',
  ['teal']: '#009688',
  ['green']: '#4caf50',
  ['light-green']: '#8bc34a',
  ['lime']: '#cddc39',
  ['amber']: '#ffc107',
  ['orange']: '#ff9800',
  ['brown']: '#795548',
  ['blue-grey']: '#607d8b',
  ['grey']: '#9e9e9e',
  ['black']: '#000000',
  ['yellow']: '#ffeb3b', // 精算用
} as const;
export type ColorCode = keyof typeof COLOR_CODE;

export const COLOR_LIST: ColorCode[] = [
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
] as const;

export const RATE_LIST = [1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1, 0] as const;
export const RATE_LABEL_LIST = ['10：0', '9：1', '8：2','7：3', '6：4', '割り勘', '4：6', '3：7','2：8', '1：9', '0：10'] as const; // prettier-ignore
export type RateColorString = string;
export const RATE_COLOR_LIST: RateColorString[] = ['red-accent-4','red-accent-3','red-accent-2','red-accent-1','red-lighten-3','purple lighten-2','blue-lighten-3','blue-accent-1','blue-accent-2','blue-accent-3','blue-accent-4'] as const; // prettier-ignore
export const RATE_BACKGROUND_COLOR_LIST = ['red-lighten-3','red-lighten-3','red-lighten-3','red-lighten-4','red-lighten-5','purple lighten-5','blue-lighten-5','blue-lighten-4','blue-lighten-3','blue-lighten-3','blue-lighten-3'] as const; // prettier-ignore
