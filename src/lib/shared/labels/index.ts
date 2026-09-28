// 横断ラベルの公開 barrel。
// skill-kick の `import L from '~/constants/labels/_index'` に相当する「1 import で
// 全横断文言を使える」入口。`import { L } from '@/lib/shared/labels'` → `L.snackbar.created`。
//
// ここに置くのは「全 feature 共通の汎用文言」だけ（成否通知・汎用ボタン・汎用エラー）。
// feature 固有の文言（画面名・ドメイン語彙・各フォームのバリデーション）は各
// features/<domain>/labels.ts に置き、feature 内でコロケーションする（横断資産にしない）。
// これにより「1 import 体験」と「feature コロケーション思想」を両立する。

import { buttonLabels } from './button';
import { errorLabels } from './error';
import { snackbarLabels } from './snackbar';

export const L = {
  snackbar: snackbarLabels,
  button: buttonLabels,
  error: errorLabels
} as const;

export type L = typeof L;

// 文言の「組み立て」は L（値の集合）に混ぜず関数として出す。
// 対象名は各 feature の labels の `dialogEntity` が持つ（キー名は横断で統一）。
export { addLabel, dialogTitle } from './dialog';
