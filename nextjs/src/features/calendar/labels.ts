// calendar 統合画面（ホーム）の feature 固有ラベル（コロケーション）。
// 横断文言（成否通知・汎用ボタン）は @/lib/shared/labels の L を使う。

export const calendarLabels = {
  heading: {
    title: 'カレンダー',
    monthSum: '月の収支',
    // 日付未選択時の記録一覧見出し。
    dayRecords: '記録'
  },
  action: {
    prevMonth: '前の月',
    nextMonth: '次の月',
    addRecord: '記録＋',
    addPlan: '予定＋',
    editRecord: '記録を編集'
  },
  empty: {
    dayRecords: '記録がありません'
  },
  event: {
    plan: '予定',
    reminder: 'リマインダー'
  },
  // カレンダーのイベント（予定/リマインダー）をクリックしたときの詳細カード文言。
  eventDetail: {
    plan: {
      deleteConfirm: '削除してもよいですか？'
    },
    reminder: {
      badge: 'リマインダー'
    }
  }
} as const;
