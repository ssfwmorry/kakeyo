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
    demo: 'デモページを見る'
  },
  toast: {
    loginFailed: 'ログインに失敗しました。入力内容をご確認ください',
    resetSendFailed: 'メール送信に失敗しました',
    resetSent: 'パスワード再設定メールを送信しました',
    demoUnavailable: 'デモログインは現在利用できません',
    demoFailed: 'デモログインに失敗しました'
  },
  validation: {
    emailFormat: 'メールアドレスの形式が正しくありません',
    passwordRequired: 'パスワードを入力してください'
  }
} as const;
