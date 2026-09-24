// calendar 統合画面（ホーム）の feature 固有ラベル（コロケーション）。
// 横断文言（成否通知・汎用ボタン）は @/lib/shared/labels の L を使う。

export const calendarLabels = {
  heading: {
    title: 'カレンダー',
    monthSum: '月の収支',
    // 日付未選択時の日パネル見出し。
    dayRecords: '記録',
    // 全記録トグル ON のときの見出し。
    monthRecords: 'この月の記録'
  },
  action: {
    prevMonth: '前の月',
    nextMonth: '次の月',
    addRecord: '記録を追加',
    addPlan: '予定を追加',
    editRecord: '記録を編集',
    // 当月の全記録を一覧表示するトグル。
    showAllRecords: '全ての記録',
    showSelectedDay: '選択日に戻す'
  },
  empty: {
    // 日パネルに予定も記録も無いときの 1 行表示。
    day: '予定も記録もありません',
    monthRecords: 'この月の記録はありません'
  },
  event: {
    plan: '予定',
    reminder: 'リマインダー',
    deleteConfirm: '削除してもよいですか？'
  }
} as const;
