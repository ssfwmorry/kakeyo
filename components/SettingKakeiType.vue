<template>
  <div>
    <h4 class="mb-2">カテゴリ</h4>

    <div class="px-3 mb-4">
      <v-row class="mb-3" no-gutters>
        <v-col class="d-flex flex-row">
          <v-btn-toggle v-model="isPay" active-class="blue-grey lighten-1" color="white" mandatory>
            <v-btn :value="true" min-width="70" class="px-0">支出</v-btn>
            <v-btn :value="false" min-width="70" class="px-0">収入</v-btn>
          </v-btn-toggle>
          <div class="ml-4 d-flex align-center">
            <v-btn icon outlined @click="isEdit = !isEdit"
              ><v-icon>{{ isEdit ? $ICONS.SWAP_VERTICAL : $ICONS.PENCIL }}</v-icon></v-btn
            >
          </div>
        </v-col>
      </v-row>

      <v-row
        v-for="(type, typeIndex) of typeList[isPay ? 'pay' : 'income'][isPair ? 'pair' : 'self']"
        :key="type.type_id"
        class="mb-2"
        no-gutters
      >
        <v-col>
          <v-card outlined class="pa-1">
            <v-row no-gutters class="mb-1">
              <v-col cols="10" class="px-4 d-flex justify-start align-center">
                <v-btn
                  icon
                  small
                  dark
                  :class="type.color_classification_name"
                  class="mr-3 btn-icon"
                >
                  <v-icon>{{ isPair ? $ICONS.SHARE : '' }}</v-icon> </v-btn
                >{{ type.type_name }}
              </v-col>
              <v-col cols="2" class="pr-4 d-flex justify-center align-center">
                <v-btn v-if="isEdit" icon @click.stop="openEditTypeDialog(type)"
                  ><v-icon>{{ $ICONS.PENCIL }}</v-icon></v-btn
                >
                <v-btn
                  v-else-if="
                    !isEdit &&
                    typeIndex <
                      typeList[isPay ? 'pay' : 'income'][isPair ? 'pair' : 'self'].length - 1
                  "
                  icon
                  @click.stop="
                    swapSort(
                      'TYPE',
                      type.type_id,
                      typeList[isPay ? 'pay' : 'income'][isPair ? 'pair' : 'self'][typeIndex + 1]
                        .type_id
                    )
                  "
                  ><v-icon>{{ $ICONS.ARROW_DOWN }}</v-icon></v-btn
                >
                <v-btn v-else icon disabled></v-btn>
              </v-col>
            </v-row>
            <v-divider class="mb-1" />
            <v-row no-gutters class="pa-1">
              <v-col
                v-for="(subType, subTypeIndex) of type.sub_types"
                :key="subType.sub_type_id"
                cols="6"
                class="col-subtype"
              >
                <v-row no-gutters>
                  <v-col cols="10" class="fs-sm"> {{ subType.sub_type_name }} </v-col>
                  <v-col cols="2" class="d-flex justify-center align-center">
                    <v-btn v-if="isEdit" icon x-small @click.stop="openEditSubTypeDialog(subType)"
                      ><v-icon>{{ $ICONS.PENCIL }}</v-icon></v-btn
                    >
                    <v-btn
                      v-else-if="!isEdit && subTypeIndex < type.sub_types.length - 1"
                      icon
                      x-small
                      @click.stop="
                        swapSort(
                          'SUB_TYPE',
                          subType.sub_type_id,
                          type.sub_types[subTypeIndex + 1].sub_type_id
                        )
                      "
                      ><v-icon>{{
                        subTypeIndex % 2 === 0 ? $ICONS.ARROW_RIGHT : $ICONS.ARROW_BOTTOM_LEFT
                      }}</v-icon></v-btn
                    >
                    <v-btn v-else icon x-small disabled></v-btn>
                  </v-col>
                </v-row>
              </v-col>
            </v-row>
            <v-row no-gutters class="d-flex justify-end align-end">
              <v-btn
                depressed
                rounded
                x-small
                color="primary"
                @click="openCreateSubTypeDialog(type)"
                >＋</v-btn
              >
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
            @click="openCreateTypeDialog()"
            >＋</v-btn
          >
        </v-col>
      </v-row>
    </div>

    <SettingDialog
      v-model="typeDialog"
      title="カテゴリ名"
      :colorList="colorList"
      @upsert="upsertApi('TYPE')"
      @delete="deleteApi('TYPE')"
    />
    <SettingDialog
      v-model="subTypeDialog"
      title="サブカテゴリ名"
      @upsert="upsertApi('SUB_TYPE')"
      @delete="deleteApi('SUB_TYPE')"
    />
  </div>
</template>

<script>
export default {
  components: {
    SettingDialog: () => import('@/components/SettingDialog'),
  },
  name: 'SettingKakeiType',
  data() {
    return {
      isPay: true,
      isEdit: true,

      typeList: {
        income: { self: [], pair: [] },
        pay: { self: [], pair: [] },
      },

      typeDialog: {
        isShow: false,
        isWithColor: true,
        selectedId: null,
        selectedName: '',
        selectedColorId: null,
      },

      subTypeDialog: {
        isShow: false,
        isWithColor: false,
        selectedParentId: null,
        selectedId: null,
        selectedName: '',
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
      const apiRes = await this.$store.dispatch('supabase-api/getTypeList');
      if (apiRes.error != null) {
        alert(apiRes.message + `(Error: ${JSON.stringify(apiRes.error)})`);
        return;
      }
      this.typeList = apiRes.data;
    },
    openCreateTypeDialog() {
      this.typeDialog = {
        isShow: true,
        isWithColor: true,
        selectedId: null,
        selectedName: '',
        selectedColorId: null,
      };
    },
    openEditTypeDialog({ type_id, type_name, color_classification_id }) {
      this.typeDialog = {
        isShow: true,
        isWithColor: true,
        selectedId: type_id,
        selectedName: type_name,
        selectedColorId: color_classification_id,
      };
    },
    async upsertApi(mode) {
      let dialog, apiName, payload;
      if (mode === 'TYPE') {
        [dialog, apiName] = [this.typeDialog, 'upsertType'];
        payload = {
          id: this.typeDialog.selectedId,
          name: this.typeDialog.selectedName,
          isPay: this.isPay,
          colorId: this.typeDialog.selectedColorId,
        };
      } else if (mode === 'SUB_TYPE') {
        [dialog, apiName] = [this.subTypeDialog, 'upsertSubType'];
        payload = {
          id: this.subTypeDialog.selectedId,
          typeId: this.subTypeDialog.selectedParentId,
          name: this.subTypeDialog.selectedName,
        };
      } else {
        alert('想定外');
        return;
      }

      const apiRes = await this.$store.dispatch(`supabase-api/${apiName}`, payload);
      if (apiRes.error !== null) {
        alert(apiRes.message + `(Error: ${JSON.stringify(apiRes.error)})`);
        return;
      }

      await this.updateShowData();
      this.$store.commit('toast', {
        message: dialog.selectedId ? '変更しました' : '登録しました',
      });
      dialog.isShow = false;
    },
    async deleteApi(mode) {
      let dialog, apiName;
      if (mode === 'TYPE') {
        [dialog, apiName] = [this.typeDialog, 'deleteType'];
      } else if (mode === 'SUB_TYPE') {
        [dialog, apiName] = [this.subTypeDialog, 'deleteSubType'];
      } else {
        alert('想定外');
        return;
      }

      const payload = { id: dialog.selectedId };
      const apiRes = await this.$store.dispatch(`supabase-api/${apiName}`, payload);
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
      dialog.isShow = false;
    },
    openCreateSubTypeDialog({ type_id }) {
      this.subTypeDialog = {
        isShow: true,
        isWithColor: false,
        selectedId: null,
        selectedParentId: type_id,
        selectedName: '',
      };
    },
    openEditSubTypeDialog({ sub_type_id, type_id, sub_type_name }) {
      this.subTypeDialog = {
        isShow: true,
        isWithColor: false,
        selectedId: sub_type_id,
        selectedParentId: type_id,
        selectedName: sub_type_name,
      };
    },
    async swapSort(mode, prevId, nextId) {
      let apiName;
      if (mode === 'TYPE') {
        apiName = 'swapType';
      } else if (mode === 'SUB_TYPE') {
        apiName = 'swapSubType';
      } else {
        alert('想定外');
        return;
      }

      const payload = { prevId: prevId, nextId: nextId };
      const apiRes = await this.$store.dispatch(`supabase-api/${apiName}`, payload);
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
.col-subtype:nth-child(even) {
  padding-left: 8px !important;
}
.col-subtype:nth-child(odd) {
  padding-right: 8px !important;
}
</style>
