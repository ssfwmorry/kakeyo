<template>
  <div>
    <h4 class="mb-2">方法</h4>
    <div class="px-3 mb-4">
      <v-row no-gutters class="mb-3">
        <v-col class="d-flex flex-row">
          <v-btn-toggle v-model="isPay" active-class="blue-grey lighten-1" color="white" mandatory>
            <v-btn :value="true" width="70" class="px-0">支払</v-btn>
            <v-btn :value="false" min-width="70" class="px-0">受取</v-btn>
          </v-btn-toggle>
          <div class="ml-4 d-flex align-center">
            <v-btn icon outlined @click="isEdit = !isEdit"
              ><v-icon>{{ isEdit ? $ICONS.SWAP_VERTICAL : $ICONS.PENCIL }}</v-icon></v-btn
            >
          </div>
        </v-col>
      </v-row>
      <v-row class="mb-3" no-gutters>
        <v-col
          v-for="(method, methodIndex) of methodList[isPay ? 'pay' : 'income'][
            isPair ? 'pair' : 'self'
          ]"
          :key="method.id"
          cols="6"
          class="mb-2 col-method"
        >
          <v-card outlined class="pa-2 d-flex align-center" min-height="54">
            <v-row no-gutters class="">
              <v-col
                cols="10"
                class="d-flex align-center"
                :class="`${method.color_classification_name}--text`"
              >
                {{ method.name }}
              </v-col>
              <v-col cols="2" class="d-flex justify-center align-center">
                <v-btn v-if="isEdit" icon @click.stop="openEditDialog(method)"
                  ><v-icon>{{ $ICONS.PENCIL }}</v-icon></v-btn
                >
                <v-btn
                  v-else-if="
                    !isEdit &&
                    methodIndex <
                      methodList[isPay ? 'pay' : 'income'][isPair ? 'pair' : 'self'].length - 1
                  "
                  icon
                  @click.stop="
                    swapSort(
                      method.id,
                      methodList[isPay ? 'pay' : 'income'][isPair ? 'pair' : 'self'][
                        methodIndex + 1
                      ].id
                    )
                  "
                  ><v-icon>{{
                    methodIndex % 2 === 0 ? $ICONS.ARROW_RIGHT : $ICONS.ARROW_BOTTOM_LEFT
                  }}</v-icon></v-btn
                >
                <v-btn v-else icon disabled></v-btn>
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
            @click="openCreateDialog()"
            >＋</v-btn
          >
        </v-col>
      </v-row>
    </div>

    <SettingDialog
      v-model="dialog"
      title="方法名"
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
  name: 'SettingKakeiMethod',
  data() {
    return {
      isPay: true,
      isEdit: true,

      methodList: {
        income: { self: [], pair: [] },
        pay: { self: [], pair: [] },
      },

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
      const apiRes = await this.$store.dispatch('supabase-api/getMethodList');
      if (apiRes.error != null) {
        alert(apiRes.message + `(Error: ${JSON.stringify(apiRes.error)})`);
        return;
      }
      this.methodList = apiRes.data;
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
    openEditDialog({ id, name, color_classification_id }) {
      this.dialog = {
        isShow: true,
        isWithColor: true,
        selectedId: id,
        selectedName: name,
        selectedColorId: color_classification_id,
      };
    },
    async upsertApi() {
      const payload = {
        id: this.dialog.selectedId,
        name: this.dialog.selectedName,
        isPay: this.isPay,
        colorId: this.dialog.selectedColorId,
      };
      const apiRes = await this.$store.dispatch('supabase-api/upsertMethod', payload);
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
    async deleteApi(mode) {
      const payload = { id: this.dialog.selectedId };
      const apiRes = await this.$store.dispatch('supabase-api/deleteMethod', payload);
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
      const apiRes = await this.$store.dispatch('supabase-api/swapMethod', payload);
      if (apiRes.error !== null) {
        alert(apiRes.message + `(Error: ${JSON.stringify(apiRes.error)})`);
        return;
      }

      await this.updateShowData();
      this.$store.commit('toast', {
        message: '入れ替えました',
      });
    },
  },
};
</script>

<style scoped lang="scss">
.col-method:nth-child(even) {
  padding-left: 4px !important;
}
.col-method:nth-child(odd) {
  padding-right: 4px !important;
}
</style>
