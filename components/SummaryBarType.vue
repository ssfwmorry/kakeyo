<template>
  <div>
    <v-row class="mb-3" no-gutters>
      <v-col class="d-flex flex-row align-center">
        <div class="d-flex align-center">
          <v-btn-toggle v-model="isPay" density="compact" variant="outlined" mandatory>
            <v-btn :value="true" min-width="60" class="px-0">支出</v-btn>
            <v-btn :value="false" min-width="60" class="px-0">収入</v-btn>
          </v-btn-toggle>
        </div>
        <div class="d-flex align-center ml-2">
          <v-chip-group
            v-model="selectedType"
            mandatory
            variant="outlined"
            selected-class="bg-blue-grey"
            @update:model-value="handleSelectType"
          >
            <v-chip
              v-for="(type, typeIndex) of typeList[isPay ? 'pay' : 'income'][
                isPair ? 'pair' : 'self'
              ]"
              :key="typeIndex"
              :text="type.typeName"
            ></v-chip>
          </v-chip-group>
        </div>
      </v-col>
    </v-row>
    <v-row class="mb-3" no-gutters> </v-row>
    MEMO: インデックス番号がはいる
    {{ selectedType }}
  </div>
</template>

<script setup lang="ts">
import { getTypeList } from '@/api/supabase/type';
import type { GetTypeListOutputData } from '@/api/supabase/type.interface';

const { enableLoading, disableLoading } = useLoadingStore();
const [authStore, pairStore] = [useAuthStore(), usePairStore()];
const { isDemoLogin, pairId, userUid } = storeToRefs(authStore);
const { isPair } = storeToRefs(pairStore);

const isPay = ref<boolean>(true);
const selectedType = ref(); // TODO: これでいいのか確認する
const typeList = ref<GetTypeListOutputData>({
  income: { self: [], pair: [] },
  pay: { self: [], pair: [] },
});

const updateShowData = async () => {
  const apiRes = await getTypeList({ userUid: userUid.value });
  assertApiResponse(apiRes);
  typeList.value = apiRes.data;
};

const handleSelectType = async () => {
  //
};

// created
(async () => {
  await updateShowData();
})();
</script>
