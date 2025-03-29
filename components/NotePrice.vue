<template>
  <div class="w-100">
    <v-row class="mb-2" no-gutters>
      <v-spacer />
      <v-col cols="9">
        <v-text-field
          readonly
          density="compact"
          hide-details
          suffix=" 円"
          height="44"
          variant="outlined"
          :value="model.toLocaleString()"
          class="text-field-price"
          :class="{ 'text-field-price-padding': !props.isShowInitPrice }"
          :append-inner-icon="model !== 0 ? $ICONS.CLOSE : ''"
          @click:append-inner="model = 0"
        ></v-text-field>
      </v-col>
    </v-row>
    <v-row v-for="i of 3" :key="i" class="mb-1" no-gutters>
      <!-- 電卓 -->
      <v-col
        v-for="j of 3"
        :key="j"
        cols="4"
        :class="{ 'pl-0 pr-1': j === 1, 'pl-1 pr-0': j === 3 }"
      >
        <v-btn
          size="x-large"
          block
          variant="flat"
          color="blue-grey-lighten-4"
          @click="pushPrice(3 * (3 - i) + j)"
          >{{ 3 * (3 - i) + j }}</v-btn
        >
      </v-col>
    </v-row>
    <v-row no-gutters>
      <v-col cols="8" class="pl-0">
        <v-btn size="x-large" block variant="flat" color="blue-grey-lighten-4" @click="pushPrice(0)"
          >0</v-btn
        >
      </v-col>
      <v-col cols="4" class="pl-1 pr-0">
        <v-btn size="x-large" block variant="flat" color="blue-grey-lighten-4" @click="popPrice()">
          <v-icon>{{ $ICONS.BACKSPACE }}</v-icon>
        </v-btn>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { MAX_PRICE } from '@/utils/constants';

const model = defineModel<number>('price', { required: true });

type Props = {
  isShowInitPrice: boolean;
};
const props = defineProps<Props>();

const pushPrice = (num: number) => {
  if (model.value === 0) {
    model.value = num;
  } else {
    if (model.value * 10 + num < MAX_PRICE) model.value = model.value * 10 + num;
  }
};
const popPrice = () => {
  model.value = Math.floor(model.value / 10);
};
</script>
