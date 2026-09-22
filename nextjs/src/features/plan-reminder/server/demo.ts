import 'server-only';
import type {
  GroupedPlanTypeList,
  GroupedReminderList,
  PlanItem
} from '../types';

// L5 のデモ用モックデータ（デモログイン時に DB へ触れず返す）。
// withDemoRead に渡す。更新系は withDemoWriteVoid で no-op 成功にするため値は不要。
// id は負値にして実データと衝突させない（type-method の demo と同方針）。

export const demoPlanTypeList: GroupedPlanTypeList = {
  self: [
    {
      id: -1,
      name: '仕事',
      colorClassificationId: 6,
      colorName: 'blue',
      isPair: false
    },
    {
      id: -2,
      name: 'プライベート',
      colorClassificationId: 10,
      colorName: 'green',
      isPair: false
    }
  ],
  pair: []
};

export const demoPlanList: PlanItem[] = [
  {
    id: -1,
    startDate: '2026-09-22',
    endDate: '2026-09-22',
    name: 'WEB 会議',
    memo: 'zoom',
    planTypeId: -1,
    planTypeName: '仕事',
    planTypeColorName: 'blue',
    reminderColorName: null,
    reminderId: null,
    isPair: false
  }
];

export const demoReminderList: GroupedReminderList = {
  self: [
    {
      id: -1,
      name: '歯医者',
      reminderType: 10,
      date: '2026-10-01',
      memo: null,
      colorClassificationId: 1,
      colorName: 'red',
      isPair: false,
      conditionId: -1,
      conditionType: 5,
      month: 6,
      monthDay: null,
      baseType: 5
    }
  ],
  pair: [],
  all: [
    {
      id: -1,
      name: '歯医者',
      reminderType: 10,
      date: '2026-10-01',
      memo: null,
      colorClassificationId: 1,
      colorName: 'red',
      isPair: false,
      conditionId: -1,
      conditionType: 5,
      month: 6,
      monthDay: null,
      baseType: 5
    }
  ]
};
