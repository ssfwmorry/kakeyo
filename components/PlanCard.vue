<template>
  <v-card variant="outlined" class="pa-2 card-border">
    <v-row no-gutters class="mb-1">
      <v-col cols="9">
        <v-card-title class="py-0 px-1 fs-nml">
          {{ props.plan.title }}
        </v-card-title>
      </v-col>
      <v-col cols="3" class="py-0 pl-1 d-flex align-center">
        <v-btn
          variant="flat"
          :class="`bg-${props.plan.backgroundColor}`"
          class="mr-3 pa-0 btn-icon size-28 text-white"
        >
          <v-icon>{{ props.plan.isPair ? $ICONS.SHARE : '' }}</v-icon>
        </v-btn>
        {{ props.plan.typeName }}
      </v-col>
    </v-row>
    <v-divider class="mb-1" />
    <v-row no-gutters>
      <v-col cols="10" class="d-flex align-center">
        <pre
          v-if="props.plan.memo"
          v-html="StringUtility.autoLink(props.plan.memo)"
          class="py-1 pl-4 text-pre-wrap fs-sm"
        ></pre>
      </v-col>
      <v-col cols="2" class="d-flex justify-center align-center">
        <div class="px-2 py-0">
          <v-btn :icon="$ICONS.PENCIL" variant="flat" @click="handleEdit"></v-btn>
        </div>
      </v-col>
    </v-row>
  </v-card>
</template>

<script setup lang="ts">
import StringUtility from '~/utils/string';
import type { EventGetPlan } from '~/utils/types/domains/calender';

const { $ICONS } = useNuxtApp();
const emits = defineEmits();

type Props = {
  plan: EventGetPlan;
};
const props = defineProps<Props>();

const handleEdit = () => {
  emits('edit');
};
</script>
