// auth feature 固有の UI 文言（feature 内コロケーション）。
// 全 feature 共通の汎用文言は @/lib/shared/labels（L）に置く。ここは auth 固有のみ。

export const authLabels = {
  appName: 'かけよ',
  tagline: '家計も予定も、ここに書けよ',
  field: {
    email: 'メールアドレス',
    password: 'パスワード'
  },
  action: {
    login: 'ログイン',
    sendReset: '再設定メールを送る',
    showReset: 'パスワードを忘れたときは',
    backToLogin: 'ログインに戻る',
    demo: 'デモページを見る',
    // 問い合わせ画面（/inquiry）への導線。
    inquiry: 'お問い合わせ',
    // 使い方（Notion チュートリアル）への外部リンク。
    tutorial: 'とりせつ'
  },
  // パスワード再設定（ログイン欄と入れ替わりで出す）。
  reset: {
    title: 'パスワードを再設定',
    hint: '登録したメールアドレス宛に、再設定の案内を送ります'
  },
  // デモのアカウント種別選択（「デモページを見る」で開くシート）。
  demo: {
    selectTitle: 'デモアカウントを選択',
    selectHint: 'デモでは登録・変更内容は保存されません',
    pair: 'ペアありアカウント',
    pairHint: 'ふたりで使う画面。共有や精算も試せます',
    solo: 'ペアなしアカウント',
    soloHint: 'ひとりで使う画面。自分の記録だけ'
  },
  toast: {
    loginFailed: 'ログインに失敗しました。入力内容をご確認ください',
    accountUnavailable: 'このアカウントは利用できません',
    resetSendFailed: 'メール送信に失敗しました',
    resetSent: 'パスワード再設定メールを送信しました',
    demoUnavailable: 'デモログインは現在利用できません'
  },
  validation: {
    emailFormat: 'メールアドレスの形式が正しくありません',
    passwordRequired: 'パスワードを入力してください'
  }
} as const;

// 使い方（とりせつ）の外部リンク先。
export const TUTORIAL_URL =
  'https://incredible-result-9c1.notion.site/245ec170d05c802dacbfd04d2ab22cbf';
