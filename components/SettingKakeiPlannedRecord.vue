<template>
  <div>
    <h4 class="mb-2">定期的な収入・支出</h4>

    <div class="px-3 mb-4">
      <v-row
        v-for="(plannedRecord, plannedRecordIndex) of plannedRecordList[isPair ? 'pair' : 'self']"
        :key="plannedRecord.planned_record_id"
        no-gutters
        class="mb-2"
      >
        <v-col cols="2" class="pa-2 fs-sm">
          <v-row no-gutters class="h-50">
            <v-col class="d-flex justify-center align-center">
              {{ plannedRecord.day_classification_name }}</v-col
            >
          </v-row>
          <v-row no-gutters class="h-50">
            <v-col class="d-flex justify-center align-end">
              <v-btn
                v-if="plannedRecordIndex < plannedRecordList[isPair ? 'pair' : 'self'].length - 1"
                icon
                small
                @click.stop="
                  swapSort(
                    plannedRecord.planned_record_id,
                    plannedRecordList[isPair ? 'pair' : 'self'][plannedRecordIndex + 1]
                      .planned_record_id
                  )
                "
                ><v-icon>{{ $ICONS.ARROW_DOWN }}</v-icon></v-btn
              >
            </v-col>
          </v-row>
        </v-col>
        <v-col cols="10">
          <RecordCard
            :isDisable="false"
            :isPairType="plannedRecord.is_pair"
            :typeColor="plannedRecord.type_color_classification_name"
            :typeAndSubtype="typeAndSubtype(plannedRecord)"
            :isShowPlannedIcon="true"
            :isEnableEdit="
              plannedRecord.is_self ||
              (plannedRecord.is_pair && plannedRecord.pair_user_name == null)
            "
            :isPairMethod="plannedRecord.is_pair && plannedRecord.pair_user_name == null"
            :userName="plannedRecord.pair_user_name ? plannedRecord.pair_user_name : ''"
            :methodColor="plannedRecord.method_color_classification_name"
            :methodName="plannedRecord.method_name"
            :memo="plannedRecord.memo"
            :isShowBlueColorPrice="!plannedRecord.is_pay"
            :price="ConvertIntToShowStrWithIsPay(plannedRecord)"
            @edit="goPlannedRecordEditPage(plannedRecord)"
          ></RecordCard>
        </v-col>
      </v-row>
      <v-row no-gutters>
        <v-col class="d-flex justify-end">
          <v-btn
            depressed
            rounded
            color="primary"
            height="32"
            width="70"
            @click="goPlannedRecordCreatePage()"
            >＋</v-btn
          >
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<script>
import StringUtility from '@/plugins/utilities/string';

export default {
  name: 'SettingKakeiPlannedRecord',
  data() {
    return {
      plannedRecordList: { self: [], pair: [] },
    };
  },
  computed: {
    isPair: {
      get() {
        return this.$store.getters.isPair;
      },
    },
  },
  async created() {
    await this.updateShowData();
  },
  methods: {
    async updateShowData() {
      const apiRes = await this.$store.dispatch('supabase-api/getPlannedRecordList');
      if (apiRes.error != null) {
        alert(apiRes.message + `(Error: ${JSON.stringify(apiRes.error)})`);
        return;
      }
      this.plannedRecordList = apiRes.data;
    },
    goPlannedRecordEditPage(plannedRecord) {
      this.$router.push({
        name: 'note',
        params: { plannedRecord: plannedRecord },
        query: { edit: true, isPlannedRecord: true },
      });
    },
    goPlannedRecordCreatePage() {
      // 形式的に、不要な id 系のフィールドもすべて指定
      const tmpPlannedRecord = {
        planned_record_id: null,
        is_pay: true,
        price: 0,
        memo: null,
        sort: null,
        updated_at: null,
        is_pair: null,
        day_classification_id: null,
        method_id: null,
        type_id: null,
        type_color_classification_id: null,
        sub_type_id: null,
      };
      this.$router.push({
        name: 'note',
        params: { plannedRecord: tmpPlannedRecord },
        query: { edit: false, isPlannedRecord: true },
      });
    },
    async swapSort(prevId, nextId) {
      const payload = { prevId: prevId, nextId: nextId };
      const apiRes = await this.$store.dispatch('supabase-api/swapPlannedRecord', payload);
      if (apiRes.error !== null) {
        alert(apiRes.message + `(Error: ${JSON.stringify(apiRes.error)})`);
        return;
      }

      await this.updateShowData();
      this.$store.commit('toast', { message: '入れ替えました' });
    },
    typeAndSubtype({ type_name, sub_type_name }) {
      if (sub_type_name) {
        return type_name + ' ー ' + sub_type_name;
      } else {
        return type_name;
      }
    },
    ConvertIntToShowStrWithIsPay({ price, is_pay }) {
      return StringUtility.ConvertIntToShowStrWithIsPay(price, is_pay);
    },
  },
};
</script>
