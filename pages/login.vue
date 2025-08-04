<template>
  <v-container class="px-5">
    <v-row justify="center">
      <v-col sm="10" md="8" class="mt-50px">
        <v-card class="pa-3">
          <v-form lazy-validation @submit.prevent>
            <v-card-title class="d-flex justify-center">{{ APP_NAME }}</v-card-title>
            <v-card-text class="pa-0">
              <v-text-field
                v-model="email"
                :label="isSignUp ? '登録用メールアドレス' : 'メールアドレス'"
                required
                outlined
              />
              <v-text-field
                v-if="!isReset"
                v-model="password"
                required
                outlined
                hide-details
                :label="isSignUp ? '登録用パスワード' : 'パスワード'"
                :append-inner-icon="isSignUp ? '' : isShowPassword ? $ICONS.EYE : $ICONS.EYE_OFF"
                :type="isSignUp || !isShowPassword ? 'password' : 'text'"
                @click:append-inner="isShowPassword = !isShowPassword"
                @keyup.enter="!isSignUp && !isReset ? userLogin() : () => {}"
              />
              <v-text-field
                v-if="isSignUp"
                v-model="confirmPassword"
                required
                outlined
                hide-details
                type="password"
                label="パスワード（確認）"
                class="mt-2"
              />
              <v-alert v-if="errorMsg" density="compact" variant="text" type="error" class="mt-1">
                {{ errorMsg }}
              </v-alert>
              <div v-if="isSignUp" class="red--text text--lighten-2 fs-sm text-center">
                本人確認メールが送られます
              </div>
            </v-card-text>
            <v-card-actions class="mt-3 mb-2 d-flex justify-center">
              <v-btn
                v-if="isReset"
                color="blue darken-3"
                :disabled="!email"
                class="w-50 text-white"
                @click="resetPassword()"
              >
                送信
              </v-btn>
              <v-btn
                v-else-if="isSignUp"
                color="blue darken-3"
                :disabled="!email || !password || !confirmPassword"
                class="w-50 text-white"
                @click="signUp()"
              >
                登録
              </v-btn>
              <v-btn
                v-else
                color="primary"
                :disabled="!email || !password"
                dark
                class="w-50"
                @click="userLogin()"
              >
                ログイン
              </v-btn>
            </v-card-actions>
          </v-form>
          <div v-if="!isSignUp && !isReset">
            <v-row no-gutters>
              <!-- TODO 機能を復活 -->
              <v-col v-if="false" class="d-flex justify-center">
                <v-btn color="primary" variant="text" @click="showSignUp()" class="fs-sm"
                  >アカウント登録</v-btn
                >
              </v-col>
              <v-col class="d-flex justify-center">
                <v-btn color="primary" variant="text" @click="showReset()" class="fs-sm"
                  >パスワード再設定</v-btn
                >
              </v-col>
            </v-row>
          </div>
          <div v-else class="text-center">
            <v-btn color="primary" variant="text" @click="resetAction()">キャンセル</v-btn>
          </div>
        </v-card>
        <div v-if="!isSignUp" class="d-flex flex-row justify-center mt-6">
          <v-btn variant="outlined" class="btn-demo mr-4" @click="demoLogin">デモページ</v-btn>
          <v-btn variant="outlined" class="btn-demo ml-4" @click="goTutorialPage"
            >とりせつ　 <v-icon>{{ $ICONS.OPEN_IN_NEW }}</v-icon></v-btn
          >
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { APP_NAME, DEMO_USER_INFO, PAGE } from '~/utils/constants';

const {
  signInByUserLogin,
  signInByDemoLogin,
  signUp: firebaseSignUp,
  sendPasswordResetEmail,
} = useFirebase();
const { setDemoLogin, setUserLogin, setUserInfo } = useAuthStore();
const config = useRuntimeConfig();
const router = useRouter();
const { getPairId } = useSupabase();
const { setToast } = useToastStore();

const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const isShowPassword = ref(false);
const errorMsg = ref('');
const isSignUp = ref(false);
const isReset = ref(false);

const userLogin = async () => {
  if (
    email.value === DEMO_USER_INFO(config).EMAIL &&
    // MEMO: 数字のみの場合はNumberとなるのでキャストする
    String(password.value) == DEMO_USER_INFO(config).PASSWORD
  ) {
    await demoLogin();
    return;
  }

  const payload = { email: email.value, password: password.value };
  const apiRes = await signInByUserLogin(payload);
  if (apiRes.error === 'EmailVerifiedError') {
    // TODO 本人確認メールで認証が終わっていないので再送する
    errorMsg.value = apiRes.message;
    return;
  }
  if (apiRes.error !== null || apiRes.data == null) {
    errorMsg.value = apiRes.message;
    return;
  }

  const apiResPairId = await getPairId({ uid: apiRes.data.uid });
  assertApiResponse(apiResPairId);

  setUserLogin();
  setUserInfo(apiRes.data, apiResPairId.data);
  goCalendarPage();
};

const demoLogin = async () => {
  const apiRes = await signInByDemoLogin();
  assertApiResponse(apiRes);

  setDemoLogin();
  setUserInfo(apiRes.data, DEMO_USER_INFO(config).PAIR_ID);
  goCalendarPage();
};

const goCalendarPage = () => {
  router.push({ name: PAGE.CALENDAR });
};

const goTutorialPage = () => {
  const url = 'https://incredible-result-9c1.notion.site/245ec170d05c802dacbfd04d2ab22cbf';
  window.open(url, '_blank');
};

const showSignUp = () => {
  resetAction();
  isSignUp.value = true;
};

const signUp = async () => {
  if (password !== confirmPassword) {
    errorMsg.value = '2 つのパスワードが一致しません';
    return;
  }
  const payload = { email: email.value, password: password.value };
  const apiRes = await firebaseSignUp(payload);
  if (apiRes.error !== null) {
    errorMsg.value = apiRes.message ?? '';
    return;
  }

  setToast('本人確認メールを送信しました。ご確認の上ログインしてください');
  resetAction();
};

const showReset = () => {
  resetAction();
  isReset.value = true;
};

const resetPassword = async () => {
  const apiRes = await sendPasswordResetEmail(email.value);
  if (apiRes.error !== null) {
    errorMsg.value = apiRes.message ?? '';
    return;
  }

  setToast('パスワード再登録用URLをメール送信しました');
  resetAction();
};

const resetAction = () => {
  // メールアドレス以外を非表示
  isSignUp.value = false;
  isReset.value = false;
  password.value = '';
  confirmPassword.value = '';
  errorMsg.value = '';
};
</script>

<style scoped lang="scss">
.btn-demo {
  border: thin solid;
  background-color: white;
}
</style>
