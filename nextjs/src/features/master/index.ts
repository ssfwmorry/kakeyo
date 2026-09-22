// master feature の公開 API（barrel）。
// マスタは画面を持たない全レーンの土台。公開するのは「型のみ」。
// リポジトリ本体（getColorClassificationList / getDayClassificationList）は
// server-only のため barrel から re-export しない（FE から誤 import されるとビルドが壊れる）。
// 他レーンは実装関数を @/features/master/server/repositories/* から直接 import する。

export type { ColorClassification } from './server/repositories/colorClassification';
export type { DayClassification } from './server/repositories/dayClassification';
