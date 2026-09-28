// auth feature 固有の UI 文言（feature 内コロケーション）。
// 全 feature 共通の汎用文言は @/lib/shared/labels（L）に置く。ここは auth 固有のみ。

export const authLabels = {
  appName: 'かけよ',
  field: {
    email: 'メールアドレス',
    password: 'パスワード',
    resetPassword: 'パスワード再設定（登録メール宛に送信）'
  },
  action: {
    login: 'ログイン',
    sendReset: '再設定メールを送る',
    // 再設定モードへ切り替える導線（戻る側は汎用の L.button.cancel を使う）。
    showReset: 'パスワード再設定',
    demo: 'デモページを見る',
    // 問い合わせ画面（/inquiry）への導線。
    inquiry: 'お問い合わせ',
    // 使い方（Notion チュートリアル）への外部リンク。
    tutorial: 'とりせつ'
  },
  // デモのアカウント種別選択（「デモページを見る」押下後に同じ画面で出す）。
  demo: {
    selectTitle: 'デモアカウントを選択',
    selectHint: 'デモでは登録・変更内容は保存されません',
    pair: 'ペアありアカウント',
    solo: 'ペアなしアカウント'
  },
  toast: {
    loginFailed: 'ログインに失敗しました。入力内容をご確認ください',
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
