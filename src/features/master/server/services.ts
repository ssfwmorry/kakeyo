import 'server-only';
import { withDemoRead } from '@/features/demo/server/inject';
import * as demoMaster from '@/features/demo/server/queries/master';
import type { SessionData } from '@/lib/shared/types/auth';
import {
  type ColorClassification,
  getColorClassificationList
} from './repositories/colorClassification';

// master の取得サービス。page から色マスタを取るときはリポジトリを直接呼ばずここを通す
// （デモで DB に触れないための withDemoRead 経路。規約「デモ注入はサービス層」）。
// 他 feature のサービス層が withDemoRead の実処理内でリポジトリを直接呼ぶのは可
// （その経路はデモでは実行されない）。
export async function getColorClassifications(
  session: SessionData
): Promise<ColorClassification[]> {
  return withDemoRead(
    session,
    () => demoMaster.getColorClassificationList(),
    () => getColorClassificationList()
  );
}
