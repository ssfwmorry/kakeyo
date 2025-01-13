<template>
  <div>
    <h4 class="mb-2">カテゴリ</h4>

    <div class="px-3 mb-4">
      <v-row
        v-for="(planType, planTypeIndex) of planTypeList[isPair ? 'pair' : 'self']"
        :key="planType.plan_type_id"
        class="mb-3"
        no-gutters
      >
        <v-col>
          <v-card outlined class="pa-1">
            <v-row no-gutters>
              <v-col cols="9" class="px-4 d-flex justify-start align-center">
                <v-btn
                  small
                  dark
                  depressed
                  width="28"
                  min-width="28"
                  :class="planType.color_classification_name"
                  class="mr-3 btn-icon"
                >
                  <v-icon>{{ isPair ? $ICONS.SHARE : '' }}</v-icon></v-btn
                >{{ planType.plan_type_name }}
              </v-col>
              <v-col cols="2" class="pr-4 d-flex justify-center align-center">
                <v-btn
                  v-if="planTypeIndex < planTypeList[isPair ? 'pair' : 'self'].length - 1"
                  icon
                  @click.stop="
                    swapSort(
                      planType.plan_type_id,
                      planTypeList[isPair ? 'pair' : 'self'][planTypeIndex + 1].plan_type_id
                    )
                  "
                  ><v-icon>{{ $ICONS.ARROW_DOWN }}</v-icon></v-btn
                >
              </v-col>
              <v-col cols="1" class="pr-4 d-flex justify-center align-center">
                <v-btn icon @click.stop="openEditDialog(planType)"
                  ><v-icon>{{ $ICONS.PENCIL }}</v-icon></v-btn
                >
              </v-col>
            </v-row>
          </v-card>
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
            @click="openCreateDialog('planType', null)"
            >＋</v-btn
          >
        </v-col>
      </v-row>
    </div>

    <SettingDialog
      v-model="dialog"
      title="カテゴリ名"
      :colorList="colorList"
      @upsert="upsertApi()"
      @delete="deleteApi()"
    />
  </div>
</template>

<script>
export default {
  components: {
    SettingDialog: () => import('@/components/SettingDialog'),
  },
  name: 'SettingPlanType',
  data() {
    return {
      isEdit: true,

      planTypeList: { self: [], pair: [] },

      dialog: {
        isShow: false,
        isWithColor: true,
        selectedId: null,
        selectedName: '',
        selectedColorId: null,
      },
    };
  },
  computed: {
    isPair: {
      get() {
        return this.$store.getters.isPair;
      },
    },
  },
  props: {
    colorList: {
      type: Array,
      default: () => [],
      required: true,
    },
  },
  async created() {
    await this.updateShowData();
  },
  methods: {
    async updateShowData() {
      const apiRes = await this.$store.dispatch('supabase-api/getPlanTypeList');
      if (apiRes.error != null) {
        alert(apiRes.message + `(Error: ${JSON.stringify(apiRes.error)})`);
        return;
      }
      this.planTypeList = apiRes.data;
    },
    openCreateDialog() {
      this.dialog = {
        isShow: true,
        isWithColor: true,
        selectedId: null,
        selectedName: '',
        selectedColorId: null,
      };
    },
    openEditDialog({ plan_type_id, plan_type_name, color_classification_id }) {
      this.dialog = {
        isShow: true,
        isWithColor: true,
        selectedId: plan_type_id,
        selectedName: plan_type_name,
        selectedColorId: color_classification_id,
      };
    },
    async upsertApi() {
      const payload = {
        id: this.dialog.selectedId,
        name: this.dialog.selectedName,
        colorId: this.dialog.selectedColorId,
      };
      const apiRes = await this.$store.dispatch('supabase-api/upsertPlanType', payload);
      if (apiRes.error !== null) {
        alert(apiRes.message + `(Error: ${JSON.stringify(apiRes.error)})`);
        return;
      }

      await this.updateShowData();
      this.$store.commit('toast', {
        message: this.dialog.selectedId ? '変更しました' : '登録しました',
      });
      this.dialog.isShow = false;
    },
    async deleteApi() {
      const payload = { id: this.dialog.selectedId };
      const apiRes = await this.$store.dispatch('supabase-api/deletePlanType', payload);
      if (apiRes.error !== null) {
        if (apiRes.error.code === '23503') {
          this.$store.commit('toast', {
            color: 'error',
            message: '紐づくデータがあるので削除できません',
          });
        } else {
          alert(apiRes.message + `(Error: ${JSON.stringify(apiRes.error)})`);
        }
        return;
      }

      await this.updateShowData();
      this.$store.commit('toast', { message: '削除しました' });
      this.dialog.isShow = false;
    },
    async swapSort(prevId, nextId) {
      const payload = { prevId: prevId, nextId: nextId };
      const apiRes = await this.$store.dispatch('supabase-api/swapPlanType', payload);
      if (apiRes.error !== null) {
        alert(apiRes.message + `(Error: ${JSON.stringify(apiRes.error)})`);
        return;
      }

      await this.updateShowData();
      this.$store.commit('toast', { message: '入れ替えました' });
    },
  },
};
</script>

<style scoped lang="scss">
.col-subtype:nth-child(even) {
  padding-left: 8px !important;
}
.col-subtype:nth-child(odd) {
  padding-right: 8px !important;
}
</style>
