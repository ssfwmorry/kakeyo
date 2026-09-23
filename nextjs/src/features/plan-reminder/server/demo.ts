import 'server-only';
import {
  BaseType,
  ConditionType,
  ReminderType
} from '../domain/reminder-condition';
import type {
  GroupedPlanTypeList,
  GroupedReminderList,
  PlanItem,
  ReminderItem
} from '../types';

// plan/reminder のデモ用モックデータ。

export const demoPlanTypeList: GroupedPlanTypeList = {
  self: [
    {
      id: 1,
      name: '仕事',
      colorClassificationId: 6,
      colorName: 'blue',
      isPair: false
    },
    {
      id: 2,
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
    id: 1,
    startDate: '2026-09-24',
    endDate: '2026-09-24',
    name: 'WEB 会議',
    memo: 'zoom',
    planTypeId: 1,
    planTypeName: '仕事',
    planTypeColorName: 'blue',
    reminderColorName: null,
    reminderId: null,
    isPair: false
  },
  {
    id: 2,
    startDate: '2026-09-26',
    endDate: '2026-09-27',
    name: '温泉旅行',
    memo: null,
    planTypeId: 2,
    planTypeName: 'プライベート',
    planTypeColorName: 'green',
    reminderColorName: null,
    reminderId: null,
    isPair: false
  }
];

// 歯医者は期日超過（date <= 今日）にして通知ベルのバッジが出る状態を見せる。
const demoReminders: ReminderItem[] = [
  {
    id: 1,
    name: '歯医者',
    reminderType: ReminderType.stock,
    date: '2026-09-20',
    memo: null,
    colorClassificationId: 1,
    colorName: 'red',
    isPair: false,
    conditionId: 1,
    conditionType: ConditionType.month,
    month: 6,
    monthDay: null,
    baseType: BaseType.now
  },
  {
    id: 2,
    name: 'クレカ引落の確認',
    reminderType: ReminderType.flow,
    date: '2026-09-27',
    memo: null,
    colorClassificationId: 13,
    colorName: 'amber',
    isPair: false,
    conditionId: 2,
    conditionType: ConditionType.month,
    month: 1,
    monthDay: null,
    baseType: BaseType.date
  }
];

export const demoReminderList: GroupedReminderList = {
  self: demoReminders,
  pair: [],
  all: demoReminders
};
