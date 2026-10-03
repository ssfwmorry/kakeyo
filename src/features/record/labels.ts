// record feature 固有の UI 文言・定数。

export const recordLabels = {
  // 収支トグル。
  payToggle: {
    pay: '支出',
    income: '収入'
  },
  // 立替チェック。
  instead: '立替',
  // 共有の支出で「だれのお金で払ったか」を選ぶ行。
  wallet: {
    label: 'お財布',
    options: {
      instead: {
        label: '自分が立替',
        help: '自分のお金で払い、あとでペアと精算します。'
      },
      shared: {
        label: '共有のお金',
        help: '共有のお金で払ったので、精算はしません。'
      }
    }
  },
  // 一覧の鍵（相手の立替）の読み上げ。
  lock: {
    partnerOnly: 'パートナーのみ編集できます'
  },
  // 入力項目名。可視ラベルを持たない項目（日付）の読み上げにも使う。
  field: {
    date: '日付',
    method: '方法',
    memo: 'メモ',
    price: '金額'
  },
  confirm: {
    delete: 'この記録を削除します。元に戻せません。'
  },
  // プレースホルダ。
  placeholder: {
    memo: 'メモ'
  },
  // 見出し・空状態。
  heading: {
    note: '記録入力'
  },
  empty: {
    // カテゴリ/方法が未設定のとき note で案内する文言。
    noTypeMethod: '設定画面でカテゴリと方法を追加してください',
    // 収支・立替の組み合わせに使える方法が 1 件もないとき。
    noMethod: '設定画面で方法を追加してください'
  },
  // record 固有の失敗分類 → 文言。
  error: {
    pairRequired: 'ペア設定が必要です',
    sameMonthOnly: '定期的なものは同月中のみ変更可能です',
    scopeLocked: '精算に関わる記録は個人・共有を変更できません',
    partnerOnly: 'パートナーが立て替えた記録は、パートナーだけが編集できます',
    noTarget: '対象がありません',
    methodRequired: '精算方法を選んでください'
  }
} as const;

// 一覧の方法の欄に出す立替の言い回し。相手の立替は相手の方法名を出しても自分には
// 意味が無いので「はなこの立替」に置き換え、自分の立替は方法名に添える。
export function insteadByLabel(userName: string): string {
  return `${userName}の立替`;
}

export function methodWithInsteadLabel(methodName: string): string {
  return `${methodName}（${recordLabels.instead}）`;
}

// 精算 record（record_type=15 / type 未設定）の表示名・表示色。
// 'yellow' はグラフ・色マスタの双方で解決できる特別扱いの色名。
export const SETTLEMENT_DISPLAY = {
  name: '精算',
  color: 'yellow'
} as const;
