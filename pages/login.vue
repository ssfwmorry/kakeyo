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
                color="blue darken-3"
                :disabled="!email || !password"
                class="w-50 text-white"
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
        <div v-if="!isSignUp" class="d-flex justify-center mt-6">
          <v-btn variant="outlined" class="btn-demo" @click="demoLogin">デモページ</v-btn>
        </div>
      </v-col>
    </v-row>

    <div class="mt-50px mb-2 w-100 text-center"><h3>〜　お知らせ　〜</h3></div>
    <v-row v-for="content in ContentList" :key="content.title" justify="center" class="pa-2 mb-3">
      <v-col sm="10" class="pa-0">
        <v-card class="pa-2 w-100" :color="content.color">
          <h4 class="pl-1">{{ content.title }}</h4>
          <v-divider class="mb-1"></v-divider>
          <div class="pl-5 fs-sm">
            <ul>
              <li v-for="item in content.items" :key="item.message" class="mb-1">
                {{ item.message }}
              </li>
            </ul>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { APP_NAME, DEMO_USER_INFO, PAGE } from '@/utils/constants';

const ContentList = [
  {
    title: '想定ユーザ',
    color: 'amber-lighten-4',
    items: [
      { message: 'レシートの項目ごとではなく、会計ごとにざっくりと記入で十分' },
      { message: '自分でつけた収入・支出の記録を「正」とみなせる' },
    ],
  },
  {
    title: 'できること',
    color: 'pink-lighten-5',
    items: [
      { message: 'スマホアプリみたいに使う' },
      { message: 'パパっと家計をつける' },
      { message: '給与や家賃などの、定期的な収入・支出を自動的に記録する' },
      { message: '自分の家計、と、パートナーと共有する家計とを分離する' },
      { message: 'パートナーとの立替を精算する' },
      { message: 'カテゴリや支払い方法のカスタマイズする' },
      { message: 'ざっくり予定とTODOを管理する' },
      { message: 'パートナーと予定を共有する' },
    ],
  },
  {
    title: 'できないこと',
    color: 'blue-lighten-5',
    items: [
      { message: 'オフラインの動作' },
      { message: '各種金融機関とのデータ共有' },
      {
        message: '「締め日」「チャージ」などの、支払いと資産反映にラグが発生するような、家計管理',
      },
    ],
  },
  {
    title: 'デモページ',
    color: 'white-lighten-5',
    items: [
      { message: '操作イメージを掴むために用意しました' },
      { message: '現在時刻を 2021.01.13 と想定しています' },
      { message: '1 ヶ月分の、でたらめなデータが入っています' },
      { message: 'データの閲覧はできますが、登録 / 削除 / 更新はできません' },
    ],
  },
];

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
    password.value === DEMO_USER_INFO(config).PASSWORD
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
