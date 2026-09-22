// master feature の公開 API（barrel）。
// マスタは画面を持たない全レーンの土台。公開するのは「型」と「色名→hex の純粋関数」。
// リポジトリ本体（getColorClassificationList / getDayClassificationList）は
// server-only のため barrel から re-export しない（FE から誤 import されるとビルドが壊れる）。
// 他レーンは実装関数を @/features/master/server/repositories/* から直接 import する。

// 色名 → hex（FE/BE 両用の純粋関数。色マスタ所有 feature が単一の正を提供する）。
export { COLOR_HEX, colorHex, FALLBACK_COLOR_HEX } from './color';
export type { ColorClassification } from './server/repositories/colorClassification';
export type { DayClassification } from './server/repositories/dayClassification';
