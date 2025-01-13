import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail as firebaseSendPasswordResetEmail, sendEmailVerification, signOut as firebaseSignOut, deleteUser as firebaseDeleteUser} from 'firebase/auth'; // prettier-ignore
import firebaseApp from '@/composables/firebase';
import { DEMO_DATA, DEMO_USER_INFO } from '@/constants';
import { IsInWhiteList } from '@/utils/others';
const config = useRuntimeConfig();
const Auth = getAuth(firebaseApp);

export const useFirebase = () => {
  async function signUp({ email, password }: { email: string; password: string }) {
    const resultSignUp = await createUserWithEmailAndPassword(Auth, email, password)
      .then((data) => {
        return { data: data, message: null, error: null };
      })
      .catch((err) => {
        console.log('signUpError', email, err);
        if (err.code === 'auth/invalid-email') {
          return { data: null, message: 'メールアドレスの形式が正しくありません', error: err };
        } else if (err.code === 'auth/email-already-in-use') {
          return { data: null, message: 'すでに使われているメールアドレスです', error: err };
        } else if (err.code === 'auth/weak-password') {
          return {
            data: null,
            message: 'パスワードには 6 文字以上の文字列を指定してください',
            error: err,
          };
        } else if (err.code === 'auth/invalid-password') {
          return { data: null, message: '無効なパスワード文字列です', error: err };
        } else {
          return { data: null, message: 'アカウント作成失敗', error: err };
        }
      });
    if (resultSignUp.error !== null || resultSignUp.data?.user === undefined) return resultSignUp;

    const resultSendEmail = await sendEmailVerification(resultSignUp.data?.user)
      .then(() => {
        return { message: null, error: null };
      })
      .catch((err) => {
        console.log('sendEmailVerificationError', err);
        return { message: 'アカウント作成確認用メールの送信失敗', error: err };
      });
    if (resultSendEmail.error !== null) return resultSendEmail;

    return { message: null, error: null };
  }

  async function signInByUserLogin({ email, password }: { email: string; password: string }) {
    return signInWithEmailAndPassword(Auth, email, password)
      .then((data) => {
        if (!IsInWhiteList(email) && data.user.emailVerified === false)
          return {
            data: null,
            message: '本人確認メール記載の URL にて認証を行ってください',
            error: 'EmailVerifiedError',
          };
        return { data: Auth.currentUser, message: null, error: null };
      })
      .catch((err) => {
        if (err.code === 'auth/invalid-email') {
          return { data: null, message: 'メールアドレスの形式が正しくありません', error: err };
        } else if (err.code === 'auth/user-disabled') {
          return { data: null, message: '無効なアカウントです', error: err };
        } else if (err.code === 'auth/user-not-found') {
          return { data: null, message: 'アカウントが見つかりません', error: err };
        } else if (err.code === 'auth/wrong-password') {
          return { data: null, message: 'パスワードが違います', error: err };
        } else {
          return { data: null, message: 'ログイン失敗', error: err };
        }
      });
  }

  async function signInByDemoLogin() {
    return signInWithEmailAndPassword(
      Auth,
      DEMO_USER_INFO(config).EMAIL,
      DEMO_USER_INFO(config).PASSWORD
    )
      .then(() => {
        if (!Auth.currentUser) throw new Error('no user');
        return { data: Auth.currentUser, message: null, error: null };
      })
      .catch((err) => {
        return { data: null, message: 'デモ用ログイン失敗', error: err };
      });
  }

  async function sendPasswordResetEmail(email: string) {
    return firebaseSendPasswordResetEmail(Auth, email)
      .then(() => {
        return { message: null, error: null };
      })
      .catch((err) => {
        if (err.code === 'auth/invalid-email') {
          return { message: 'メールアドレスの形式が正しくありません', error: err };
        } else if (err.code === 'auth/user-disabled') {
          return { message: '無効なアカウントです', error: err };
        } else if (err.code === 'auth/user-not-found') {
          return { message: 'アカウントが見つかりません', error: err };
        } else {
          return { message: 'パスワード再設定用メール送信失敗', error: err };
        }
      });
  }

  async function signOut() {
    return firebaseSignOut(Auth)
      .then(() => {
        return { error: null };
      })
      .catch((err) => {
        return { message: 'ログアウト失敗', error: err };
      });
  }

  async function deleteUser() {
    if (Auth.currentUser === null) return { message: 'アカウント削除失敗', error: 'ユーザがない' };

    if (DEMO_DATA.IS_RELEASE && Auth.currentUser.uid === DEMO_USER_INFO(config).UID)
      return DEMO_DATA.DELETE_USER;
    return firebaseDeleteUser(Auth.currentUser)
      .then(() => {
        return { message: '', error: null };
      })
      .catch((err) => {
        console.log('deleteUserError', err);
        return { message: 'アカウント削除失敗', error: err };
      });
  }

  return {
    signUp,
    signInByUserLogin,
    signInByDemoLogin,
    sendPasswordResetEmail,
    signOut,
    deleteUser,
  };
};
