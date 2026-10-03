import { insteadByLabel, methodWithInsteadLabel } from '../labels';
import { isPartnerInstead } from './record-fields';

// 一覧の金額の下に出す文字列。カレンダーの日別リストと集計の明細で共有する。
// 「どうやって払ったか」の欄なので、相手の立替もここで答える（方法名は相手のもの）。
export function methodLineText(record: {
  isSelf: boolean;
  isInstead: boolean | null;
  methodName: string;
  pairUserName: string | null;
}): string {
  if (isPartnerInstead(record)) {
    return insteadByLabel(record.pairUserName ?? '');
  }
  if (record.isInstead === true) {
    return methodWithInsteadLabel(record.methodName);
  }
  return record.methodName;
}
