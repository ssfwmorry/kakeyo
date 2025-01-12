<template>
  <div>
    <h4 class="mb-2">初期画面</h4>
    <div class="px-3 mb-4">
      <v-row no-gutters class="mb-3">
        <v-radio-group v-model="isCalendarPageMain" row dense hide-details class="mt-0 pt-0">
          <v-radio label="カレンダー画面" :value="true"></v-radio>
          <v-radio label="入力画面" :value="false"></v-radio>
        </v-radio-group>
      </v-row>
      <div v-if="isCalendarPageMain !== recievedIsCalendarPageMain" class="pl-8">
        <p class="mb-1 grey--text text--darken-2 fs-sm">設定はブラウザに保存されます</p>
        <v-row no-gutters>
          <v-btn
            depressed
            max-height="30"
            color="primary"
            class="btn-action"
            @click="setIsCalendarPageMain()"
          >
            変更
          </v-btn>
        </v-row>
      </div>
    </div>

    <h4 class="mb-2">カレンダー</h4>
    <div class="px-3 mb-4">
      <p>週の見た目</p>
      <v-row no-gutters class="mb-3">
        <v-radio-group v-model="isSundayStart" row dense hide-details class="mt-0 pt-0">
          <v-radio label="日曜はじまり" :value="true"></v-radio>
          <v-radio label="月曜はじまり" :value="false"></v-radio>
        </v-radio-group>
      </v-row>
      <div v-if="isSundayStart !== recievedIsSundayStart" class="pl-8">
        <p class="mb-1 grey--text text--darken-2 fs-sm">設定はブラウザに保存されます</p>
        <v-row no-gutters>
          <v-btn
            depressed
            max-height="30"
            color="primary"
            class="btn-action"
            @click="setIsSundayStart()"
          >
            変更
          </v-btn>
        </v-row>
      </div>
    </div>

    <!-- record 表示 or 非表示 -->
    <div class="px-3 mb-2">
      <p>記録</p>
      <v-row no-gutters class="mb-3">
        <v-radio-group v-model="isShowRecord" row dense hide-details class="mt-0 pt-0">
          <v-radio label="表示" :value="true"></v-radio>
          <v-radio label="表示しない" :value="false"></v-radio>
        </v-radio-group>
      </v-row>
      <div v-if="isShowRecord !== recievedIsShowRecord" class="pl-8">
        <p class="mb-1 grey--text text--darken-2 fs-sm">設定はブラウザに保存されます</p>
        <v-row no-gutters>
          <v-btn
            depressed
            max-height="30"
            color="primary"
            class="btn-action"
            @click="setIsShowRecord()"
          >
            変更
          </v-btn>
        </v-row>
      </div>
    </div>

    <!-- record 自分 or 共有 or 両方 -->
    <div class="pr-3 pl-8 mb-4">
      <p class="mb-2">共有データの表示</p>
      <v-row no-gutters class="mb-3">
        <v-radio-group
          v-model="showRecordMode"
          row
          dense
          hide-details
          class="mt-0 pt-0"
          :disabled="!recievedIsShowRecord"
        >
          <v-radio label="自分のみ" :value="'SELF'"></v-radio>
          <v-radio label="共有のみ" :value="'PAIR'"></v-radio>
          <v-radio label="両方" :value="'BOTH'"></v-radio>
        </v-radio-group>
      </v-row>
      <div v-if="showRecordMode !== recievedShowRecordMode" class="pl-8">
        <p class="mb-1 grey--text text--darken-2 fs-sm">設定はブラウザに保存されます</p>
        <v-row no-gutters>
          <v-btn
            depressed
            max-height="30"
            color="primary"
            class="btn-action"
            @click="setShowRecordMode()"
          >
            変更
          </v-btn>
        </v-row>
      </div>
    </div>

    <!-- plan 表示 or 非表示 -->
    <div class="px-3 mb-2">
      <p>予定</p>
      <v-row no-gutters class="mb-3">
        <v-radio-group v-model="isShowPlan" row dense hide-details class="mt-0 pt-0">
          <v-radio label="表示" :value="true"></v-radio>
          <v-radio label="表示しない" :value="false"></v-radio>
        </v-radio-group>
      </v-row>
      <div v-if="isShowPlan !== recievedIsShowPlan" class="pl-8">
        <p class="mb-1 grey--text text--darken-2 fs-sm">設定はブラウザに保存されます</p>
        <v-row no-gutters>
          <v-btn
            depressed
            max-height="30"
            color="primary"
            class="btn-action"
            @click="setIsShowPlan()"
          >
            変更
          </v-btn>
        </v-row>
      </div>
    </div>

    <!-- plan 自分 or 共有 or 両方 -->
    <div class="pr-3 pl-8 mb-4">
      <p class="mb-2">共有データの表示</p>
      <v-row no-gutters class="mb-3">
        <v-radio-group
          v-model="showPlanMode"
          row
          dense
          hide-details
          class="mt-0 pt-0"
          :disabled="!recievedIsShowPlan"
        >
          <v-radio label="自分のみ" :value="'SELF'"></v-radio>
          <v-radio label="共有のみ" :value="'PAIR'"></v-radio>
          <v-radio label="両方" :value="'BOTH'"></v-radio>
        </v-radio-group>
      </v-row>
      <div v-if="showPlanMode !== recievedShowPlanMode" class="pl-8">
        <p class="mb-1 grey--text text--darken-2 fs-sm">設定はブラウザに保存されます</p>
        <v-row no-gutters>
          <v-btn
            depressed
            max-height="30"
            color="primary"
            class="btn-action"
            @click="setShowPlanMode()"
          >
            変更
          </v-btn>
        </v-row>
      </div>
    </div>

    <h4 class="mb-2">共有ユーザ</h4>
    <div class="px-3 mb-4">
      <!-- TODO 動的に表示 -->
      <p>お相手のメールアドレス: XXXXXXXX@XXXX.XXX</p>
      <p class="fs-sm">
        （共有するユーザの設定をしたい場合は
        <router-link to="inqury">問い合わせ</router-link>
        よりお願いします。）
      </p>
    </div>

    <h4 class="mb-2">アカウント削除</h4>
    <div class="px-3">
      <p class="mb-1 fs-sm">
        <span class="red--text">アカウントに関するデータが全て消える</span>
        ので、以下に同意をしてください
      </p>
      <v-row no-gutters class="pl-1">
        <v-checkbox
          v-model="isShowReallyDelete"
          dense
          hide-details
          label="消しても後悔しません"
          :disabled="isShowReallyDelete && isDeletable"
          class="pt-0 mt-0"
        ></v-checkbox>
      </v-row>
      <v-row v-if="isShowReallyDelete" no-gutters class="mt-1 pl-1">
        <v-checkbox
          v-model="isDeletable"
          dense
          hide-details
          label="開発者にデータの復元を求めません"
          class="pt-0 mt-0"
        ></v-checkbox>
      </v-row>
      <v-row v-if="isShowReallyDelete && isDeletable" no-gutters class="mt-3 pl-8">
        <v-btn depressed max-height="30" color="error" class="btn-action" @click="deleteUser()">
          削除
        </v-btn>
      </v-row>
    </div>
  </div>
</template>

<script>
import { LOCAL_STORAGE_KEY } from '@/plugins/constants/index';

export default {
  name: 'SettingGeneral',
  data() {
    return {
      // 初期画面
      isCalendarPageMain: true,
      recievedIsCalendarPageMain: true,

      // カレンダー
      isSundayStart: true,
      recievedIsSundayStart: true,
      isShowRecord: true,
      recievedIsShowRecord: true,
      showRecordMode: 'BOTH',
      recievedShowRecordMode: 'BOTH', // 'SELF' or 'PAIR' or 'BOTH'
      isShowPlan: true,
      recievedIsShowPlan: true,
      showPlanMode: 'BOTH',
      recievedShowPlanMode: 'BOTH', // 'SELF' or 'PAIR' or 'BOTH'

      // アカウント削除
      isShowReallyDelete: false,
      isDeletable: false,
    };
  },
  async created() {
    this.recievedIsCalendarPageMain =
      localStorage.getItem(LOCAL_STORAGE_KEY.IS_CALENDAR_PAGE_MAIN) === 'false' ? false : true;
    this.isCalendarPageMain = this.recievedIsCalendarPageMain;

    this.recievedIsSundayStart =
      localStorage.getItem(LOCAL_STORAGE_KEY.IS_SUNDAY_START) === 'false' ? false : true;
    this.isSundayStart = this.recievedIsSundayStart;

    this.recievedIsShowRecord =
      localStorage.getItem(LOCAL_STORAGE_KEY.IS_SHOW_RECORD) === 'false' ? false : true;
    this.isShowRecord = this.recievedIsShowRecord;

    this.recievedShowRecordMode =
      localStorage.getItem(LOCAL_STORAGE_KEY.SHOW_RECORD_MODE) ?? 'BOTH';
    this.showRecordMode = this.recievedShowRecordMode;

    this.recievedIsShowPlan =
      localStorage.getItem(LOCAL_STORAGE_KEY.IS_SHOW_PLAN) === 'false' ? false : true;
    this.isShowPlan = this.recievedIsShowPlan;

    this.recievedShowPlanMode = localStorage.getItem(LOCAL_STORAGE_KEY.SHOW_PLAN_MODE) ?? 'BOTH';
    this.showPlanMode = this.recievedShowPlanMode;
  },
  methods: {
    setIsCalendarPageMain() {
      if (this.isCalendarPageMain) {
        localStorage.removeItem(LOCAL_STORAGE_KEY.IS_CALENDAR_PAGE_MAIN);
        this.isCalendarPageMain = this.recievedIsCalendarPageMain = true;
      } else {
        localStorage.setItem(LOCAL_STORAGE_KEY.IS_CALENDAR_PAGE_MAIN, false);
        this.isCalendarPageMain = this.recievedIsCalendarPageMain = false;
      }

      this.$store.commit('toast', { message: '変更しました' });
      this.$router.go({ path: '/', force: true }); // MEMO: '/' へのリダイレクトでうまくいく
    },
    setIsSundayStart() {
      if (this.isSundayStart) {
        localStorage.removeItem(LOCAL_STORAGE_KEY.IS_SUNDAY_START);
        this.isSundayStart = this.recievedIsSundayStart = true;
      } else {
        localStorage.setItem(LOCAL_STORAGE_KEY.IS_SUNDAY_START, false);
        this.isSundayStart = this.recievedIsSundayStart = false;
      }

      this.$store.commit('toast', { message: '変更しました' });
    },
    setIsShowRecord() {
      if (this.isShowRecord) {
        localStorage.removeItem(LOCAL_STORAGE_KEY.IS_SHOW_RECORD);
        this.isShowRecord = this.recievedIsShowRecord = true;
      } else {
        localStorage.setItem(LOCAL_STORAGE_KEY.IS_SHOW_RECORD, false);
        this.isShowRecord = this.recievedIsShowRecord = false;
      }

      this.$store.commit('toast', { message: '変更しました' });
    },
    setIsShowPlan() {
      if (this.isShowPlan) {
        localStorage.removeItem(LOCAL_STORAGE_KEY.IS_SHOW_PLAN);
        this.isShowPlan = this.recievedIsShowPlan = true;
      } else {
        localStorage.setItem(LOCAL_STORAGE_KEY.IS_SHOW_PLAN, false);
        this.isShowPlan = this.recievedIsShowPlan = false;
      }

      this.$store.commit('toast', { message: '変更しました' });
    },
    setShowRecordMode() {
      localStorage.setItem(LOCAL_STORAGE_KEY.SHOW_RECORD_MODE, this.showRecordMode);
      this.recievedShowRecordMode = this.showRecordMode;

      this.$store.commit('toast', { message: '変更しました' });
    },
    setShowPlanMode() {
      localStorage.setItem(LOCAL_STORAGE_KEY.SHOW_PLAN_MODE, this.showPlanMode);
      this.recievedShowPlanMode = this.showPlanMode;

      this.$store.commit('toast', { message: '変更しました' });
    },
    async deleteUser() {
      this.$store.commit('logout');
      this.$router.push({ name: 'login' });

      // ユーザ認証情報の削除
      const apiResAuth = await this.$store.dispatch('firebase-api/deleteUser');
      if (apiResAuth.error !== null) {
        alert(apiResAuth.message + `(Error: ${apiResAuth.error})`);
        return;
      }
      this.$store.commit('toast', { message: 'アカウントを削除しました' });
    },
  },
};
</script>
