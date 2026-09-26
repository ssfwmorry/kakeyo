import 'server-only';
import {
  groupMethodList,
  groupTypeList
} from '@/features/type-method/grouping';
import type { MethodRow } from '@/features/type-method/server/repositories/method';
import type { TypeRow } from '@/features/type-method/server/repositories/type';
import type {
  GroupedMethodList,
  GroupedTypeList
} from '@/features/type-method/types';
import type { SessionScope } from '@/lib/shared/types/auth';
import { methodRows } from '../dataset/methods';
import { visibleTo } from '../dataset/scope';
import { subTypesOf, typeRows } from '../dataset/types';
import { getColorClassificationList } from './master';

// type-method のデモ射影。dataset を実リポジトリと同じ行型（TypeRow / MethodRow）に写し、
// グルーピングは実処理と同じ groupTypeList / groupMethodList に任せる。

// findTypeRows 相当。宣言順 = sort 順。
function findTypeRows(scope: SessionScope): TypeRow[] {
  return visibleTo(scope, typeRows).map((row) => ({
    id: row.id,
    name: row.name,
    isPay: row.isPay,
    sort: row.id,
    colorClassificationId: row.colorId,
    pairId: row.pairId,
    subTypes: subTypesOf(row.id).map((sub) => ({
      id: sub.id,
      name: sub.name,
      sort: sub.id
    }))
  }));
}

// findMethodRows 相当。
function findMethodRows(scope: SessionScope): MethodRow[] {
  return visibleTo(scope, methodRows).map((row) => ({
    id: row.id,
    name: row.name,
    isPay: row.isPay,
    sort: row.id,
    colorClassificationId: row.colorId,
    pairId: row.pairId
  }));
}

export function getTypeCardList(scope: SessionScope): GroupedTypeList {
  return groupTypeList(findTypeRows(scope), getColorClassificationList());
}

export function getMethodCardList(scope: SessionScope): GroupedMethodList {
  return groupMethodList(findMethodRows(scope), getColorClassificationList());
}
