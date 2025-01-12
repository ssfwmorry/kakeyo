<template>
  <v-dialog :value="dialog.isShow" :transition="false" max-width="600" @click:outside="closeDialog">
    <v-card class="pa-4">
      <v-row no-gutters class="mb-2">
        <h4>{{ title }}</h4></v-row
      >
      <v-row no-gutters class="mb-3 px-2">
        <v-text-field
          v-model="dialog.selectedName"
          dense
          hide-details
          ref="dialogTextField"
          placeholder="例：その他"
        ></v-text-field>
      </v-row>
      <div v-if="dialog.isWithColor">
        <v-row no-gutters class="mb-2"> <h4>色の選択</h4></v-row>
        <v-row no-gutters class="mb-1">
          <v-col
            v-for="{ id, name } of colorList"
            :key="id"
            cols="2"
            class="px-1 mb-2 d-flex justify-center align-center"
          >
            <v-btn small dark depressed fab :color="name" @click="updateSelectedColorId(id)">{{
              dialog.selectedColorId === id ? '●' : ''
            }}</v-btn>
          </v-col>
        </v-row>
      </div>
      <v-divider class="mb-3"></v-divider>
      <v-card-actions class="d-flex justify-space-between">
        <v-btn v-if="dialog.selectedId !== null" depressed color="error" @click="deleteApi()">
          <v-icon>{{ $ICONS.TRASH }}</v-icon>
        </v-btn>
        <v-btn
          :loading="loading"
          depressed
          width="80"
          color="primary"
          :disabled="isDisableDialogPostBtn()"
          class="ml-auto"
          @click="upsertApi()"
        >
          {{ dialog.selectedId === null ? '登録' : '変更' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'SettingDialog',
  data() {
    return {
      loading: false,
    };
  },
  model: {
    prop: 'dialog',
    event: 'change-dialog',
  },
  props: {
    dialog: {
      type: Object,
      default: () => ({
        isShow: false,
        isWithColor: false,
        selectedId: null,
        selectedParentId: null,
        selectedName: '',
        selectedColorId: null,
      }),
      required: true,
    },
    title: {
      type: String,
      default: '',
    },
    colorList: {
      type: Array,
      default: () => [],
      required: false,
    },
  },
  created() {},
  methods: {
    closeDialog() {
      const dialog = {
        isShow: false,
        isWithColor: this.dialog.isWithColor,
        selectedId: null,
        selectedParentId: null,
        selectedName: '',
        selectedColorId: null,
      };
      this.$emit('change-dialog', dialog);
    },
    updateSelectedColorId(id) {
      this.dialog.selectedColorId = id;
    },
    isDisableDialogPostBtn() {
      if (this.dialog.isWithColor) {
        return this.dialog.selectedName === '' || this.dialog.selectedColorId === null;
      } else {
        return this.dialog.selectedName === '';
      }
    },
    async upsertApi() {
      this.loading = true;
      this.$emit('upsert');
      this.loading = false;
    },
    async deleteApi() {
      this.$emit('delete');
    },
  },
};
</script>
