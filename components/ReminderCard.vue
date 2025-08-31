<template>
  <v-card variant="outlined" class="pa-2 card-border">
    <v-row no-gutters class="mb-1">
      <v-col>
        <v-card-title class="py-0 px-1 fs-nml">
          <v-btn
            size="28"
            rounded="0"
            variant="flat"
            :class="`bg-${props.reminder.reminderColor}`"
            class="mr-3 pa-0 btn-icon text-white"
          >
            <v-icon>{{ props.reminder.isPair ? $ICONS.SHARE : '' }}</v-icon>
          </v-btn>
          {{ props.reminder.title }}
        </v-card-title>
      </v-col>
    </v-row>
    <v-divider v-if="props.reminder.memo" class="mb-1" />
    <v-row v-if="props.reminder.memo" no-gutters>
      <v-col cols="10" class="d-flex align-center">
        <pre
          v-html="StringUtility.autoLink(props.reminder.memo)"
          class="py-1 pl-4 text-pre-wrap fs-sm"
        ></pre>
      </v-col>
      <v-col cols="2" />
    </v-row>
  </v-card>
</template>

<script setup lang="ts">
import StringUtility from '~/utils/string';
import type { EventGetReminder } from '~/utils/types/domains/calender';

const { $ICONS } = useNuxtApp();
const emits = defineEmits();

type Props = {
  reminder: EventGetReminder;
};
const props = defineProps<Props>();
</script>
