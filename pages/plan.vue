<template>
  <v-container class="px-10 pt-100px pb-0 h-100 bg-white">
    <v-row no-gutters class="mb-3">
      <v-col>
        <v-text-field
          v-model="name"
          single-line
          hide-details
          variant="underlined"
          placeholder="例：18:30飲み会"
        ></v-text-field>
      </v-col>
    </v-row>
    <v-row no-gutters class="mb-0">
      <v-col class="col-textfield">
        <v-btn
          id="btn-plan-date"
          variant="flat"
          height="40"
          class="px-2 fw-nml fs-nml"
          color="grey-lighten-3"
        >
          <v-icon color="grey darken-1" class="pr-1">{{ $ICONS.CALENDAR }}</v-icon>
          {{ selectedDateOrPeriod }}
          <v-menu
            v-model="isOpenDatePicker"
            nudge-bottom
            max-width="600"
            activator="#btn-plan-date"
            transition="scale-transition"
            :close-on-click="isPeriod && dates.length === 1 ? false : true"
            :close-on-content-click="false"
            @update:model-value="updateMenu"
          >
            <v-date-picker
              v-if="isPeriod"
              v-model="dates"
              multiple="range"
              hide-header
              full-width
              show-adjacent-months
              min="2000-01-01"
              max="2099-12-31"
              @update:model-value="updateDates"
            ></v-date-picker>
            <v-date-picker
              v-else
              v-model="date"
              hide-header
              full-width
              show-adjacent-months
              min="2000-01-01"
              max="2099-12-31"
              @update:model-value="updateDate"
            ></v-date-picker>
          </v-menu>
        </v-btn>
      </v-col>
      <v-col class="pl-2 d-flex align-center">
        <v-checkbox
          v-model="isPeriod"
          density="compact"
          hide-details
          label="期間指定"
          class="pt-0 mt-0"
        ></v-checkbox>
      </v-col>
    </v-row>
    <v-row v-if="planTypeList[isPair ? 'pair' : 'self'].length == 0" no-gutters class="mt-2">
      <div>設定画面でカテゴリを追加してください</div>
    </v-row>
    <v-row v-else no-gutters class="my-3">
      <v-col>
        <v-select
          v-model="selectedPlanTypeId"
          :items="planTypeList[isPair ? 'pair' : 'self']"
          item-title="planTypeName"
          item-value="planTypeId"
          density="compact"
          variant="underlined"
          :menu-props="{ maxHeight: 400 }"
          hide-details
          disable-lookup
          single-line
        ></v-select>
      </v-col>
    </v-row>
    <v-row no-gutters class="mb-3">
      <v-col>
        <v-textarea
          v-model="memo"
          variant="outlined"
          hide-details
          placeholder="例：いつものお店にて"
        ></v-textarea>
      </v-col>
    </v-row>
    <v-row no-gutters>
      <!-- ゴミ箱 -->
      <v-col v-if="id" class="col-btn">
        <v-btn variant="flat" color="error" class="btn-action" @click="deletePlan()">
          <v-icon>{{ $ICONS.TRASH }}</v-icon>
        </v-btn>
      </v-col>
      <v-spacer />
      <!-- 登録変更 -->
      <v-col cols="5">
        <v-btn
          :loading="loading"
          x-large
          block
          variant="flat"
          color="primary"
          height="44"
          :disabled="name === '' || !selectedPlanTypeId || (isPeriod && dates.length === 0)"
          @click="upsertPlan()"
        >
          {{ id === null ? '登録' : '変更' }}
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import type { GetPlanTypeListOutput } from '@/api/supabase/planType.interface';
import { DUMMY, PAGE } from '@/utils/constants';
import { format } from '@/utils/string';
import TimeUtility from '@/utils/time';
import {
  crud,
  type Crud,
  type Id,
  type Plan,
  type RouterQueryCalendarToPlan,
  type RouterQueryPlanToCalendar,
} from '@/utils/types/common';
import { routerParamKey } from '@/utils/types/page';
import dayjs, { type Dayjs } from 'dayjs';

const [loginStore, pairStore, userStore] = [useLoginStore(), usePairStore(), useUserStore()];
const { isDemoLogin } = storeToRefs(loginStore);
const { isPair, pairId } = storeToRefs(pairStore);
const { userUid } = storeToRefs(userStore);
const route = useRoute();
const router = useRouter();
const {
  deletePlan: supabaseDeletePlan,
  getPlanTypeList,
  upsertPlan: supabaseUpsertPlan,
} = useSupabase();
const { routerParam } = useRouterParamStore();
const { setToast } = useToastStore();

const id = ref<Id | null>(null);
const name = ref<string>('');
const isPeriod = ref<boolean>(false);
const isOpenDatePicker = ref<boolean>(false);
const date = ref<Dayjs | null>(null);
const dates = ref<Dayjs[]>([]);
const selectedPlanTypeId = ref<number | null>(null);
const memo = ref<string | null>(null);
const planTypeList = ref<GetPlanTypeListOutput['data']>({ self: [], pair: [] });
const loading = ref<boolean>(false);

const selectedDateOrPeriod = computed(() => {
  if (isPeriod.value) {
    if (dates.value.length === 0) return '選択してください';
    return TimeUtility.ConvertDateStrsToPeriod(
      dates.value[0].format(format.Date),
      dates.value[dates.value.length - 1].format(format.Date)
    );
  } else {
    return date.value !== null ? date.value.format(format.Date) : '選択してください';
  }
});
const setPagePlan = (plan: Plan, c: Crud) => {
  // 新規作成の場合
  if (c === crud.CREATE) {
    const list = planTypeList.value[isPair.value ? 'pair' : 'self'];
    if (list.length > 0) {
      selectedPlanTypeId.value = list[0].planTypeId;
    } else {
      selectedPlanTypeId.value = null;
    }

    isPeriod.value = false;
    date.value = dayjs(plan.start_date);
    dates.value = [];
    return;
  }

  // 編集の場合
  id.value = plan.id;
  name.value = plan.name;
  selectedPlanTypeId.value = plan.plan_type_id;
  memo.value = plan.memo;
  isPeriod.value = !TimeUtility.IsSameDateStr(plan.start_date, plan.end_date);
  date.value = dayjs(plan.start_date);
  const tmpDate = TimeUtility.PaddingDayjsDates(dayjs(plan.start_date), dayjs(plan.end_date));
  dates.value = tmpDate.length === 1 ? [] : tmpDate;
};
const upsertPlan = async () => {
  loading.value = true;
  if (!validatePlanAndShowErrorMsg()) return;

  const period = getPlanPeriod();
  const payload = {
    id: id.value,
    startDate: period.start,
    endDate: period.end,
    planTypeId: selectedPlanTypeId.value ?? DUMMY.NM,
    name: name.value,
    memo: memo.value,
  };
  const apiRes = await supabaseUpsertPlan(
    {
      isDemoLogin: isDemoLogin.value,
      userUid: userUid.value ?? DUMMY.STR,
      isPair: isPair.value,
      pairId: pairId.value ?? DUMMY.NM,
    },
    payload
  );
  if (apiRes.error !== null) {
    alert(apiRes.message + `(Error: ${JSON.stringify(apiRes.error)})`);
    return;
  }

  setToast(id.value ? '変更しました' : '登録しました');
  const tmpDate = isPeriod.value ? dates.value[0] : date.value;
  if (tmpDate === null) throw new Error('upsertPlan');
  const dateStr = tmpDate.format(format.Date);
  const query: RouterQueryPlanToCalendar = { focus: dateStr };
  router.push({ name: PAGE.CALENDAR, query });

  loading.value = false;
};
const validatePlanAndShowErrorMsg = () => {
  // ボタンが非活性なので以下は起こらない想定
  if (name.value === '') return false;
  if (!selectedPlanTypeId.value) return false;

  // 期間の確認
  if (isPeriod.value) {
    if (dates.value.length == 0) {
      return false;
    } else if (
      !TimeUtility.IsPeriod(
        dates.value[0].format(format.Date),
        dates.value[dates.value.length - 1].format(format.Date)
      )
    ) {
      setToast('期間の終始がおかしいです', 'error');
      return false;
    }
  } else {
    // 期間指定ではない場合 true で返す
  }

  return true;
};
const getPlanPeriod = () => {
  if (isPeriod.value) {
    return {
      start: dates.value[0].format(format.Date),
      end: dates.value[dates.value.length - 1].format(format.Date),
    };
  } else {
    if (date.value === null) throw new Error('getPlanPeriod');
    return { start: date.value.format(format.Date), end: date.value.format(format.Date) };
  }
};
const deletePlan = async () => {
  if (id.value === null) throw new Error('deletePlan');

  const payload = { id: id.value };
  const apiRes = await supabaseDeletePlan({ isDemoLogin: isDemoLogin.value }, payload);
  if (apiRes.error !== null) {
    alert(apiRes.message + `(Error: ${JSON.stringify(apiRes.error)})`);
    return;
  }
  setToast('削除しました');
  const tmpDate = isPeriod.value ? dates.value[0] : date.value;
  if (tmpDate === null) throw new Error('deletePlan');
  const dateStr = tmpDate.format(format.Date);
  const query: RouterQueryPlanToCalendar = { focus: dateStr };
  router.push({ name: PAGE.CALENDAR, query });
};
const updateMenu = () => {
  if (isOpenDatePicker.value && dates.value.length == 1) dates.value = [];
};
const updateDates = () => {
  date.value = null;
  if (dates.value.length >= 2) isOpenDatePicker.value = false;
};
const updateDate = () => {
  dates.value = [];
  isOpenDatePicker.value = false;
};

watch(isPair, (newValue, oldValue) => {
  selectedPlanTypeId.value = null;
});

// created
(async () => {
  const apiRes = await getPlanTypeList({
    isDemoLogin: isDemoLogin.value,
    userUid: userUid.value ?? DUMMY.STR,
  });
  if (apiRes.error != null) {
    alert(apiRes.message + `(Error: ${JSON.stringify(apiRes.error)})`);
    return;
  }
  planTypeList.value = apiRes.data;

  const routerQuery = route.query as RouterQueryCalendarToPlan;
  const plan = routerParam<Plan>(routerParamKey.PLAN);
  if (plan == null) throw new Error('created');
  setPagePlan(plan, routerQuery.crud);
})();
</script>

<style lang="scss" scoped>
.col-textfield {
  flex-grow: 0;
}
:deep(.text-field-date .v-input__slot:before) {
  border-width: 0 !important;
}
.text-field-date {
  width: 10rem;
}
// planTypeのv-selectのmenuの表示
.v-menu__content {
  max-height: 80vh;
}
.col-btn {
  margin-right: 10px;
  flex-grow: 0;
}
</style>
