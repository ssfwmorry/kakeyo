import 'server-only';
import { defineTable, indexById } from './table';

// color_classifications（全ユーザ共通の静的マスタ）。
// 実マスタと同じ id・名前になるよう、実 DB の id 順（1 = red 〜 18 = black）で宣言する。
// 各テーブルの色は colors.<name>.id で参照し、色名は射影時にここから引く。

export type DemoColor = { id: number; name: string };

export const [colors, colorRows] = defineTable({
  red: { name: 'red' },
  pink: { name: 'pink' },
  purple: { name: 'purple' },
  deepPurple: { name: 'deep-purple' },
  indigo: { name: 'indigo' },
  blue: { name: 'blue' },
  lightBlue: { name: 'light-blue' },
  cyan: { name: 'cyan' },
  teal: { name: 'teal' },
  green: { name: 'green' },
  lightGreen: { name: 'light-green' },
  lime: { name: 'lime' },
  amber: { name: 'amber' },
  orange: { name: 'orange' },
  brown: { name: 'brown' },
  blueGrey: { name: 'blue-grey' },
  grey: { name: 'grey' },
  black: { name: 'black' }
});

const findColor = indexById('colors', colorRows);

// 色 id → 色名（colorClassification.name の join 相当）。
export function colorName(colorId: number): string {
  return findColor(colorId).name;
}
