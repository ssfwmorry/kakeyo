<template>
  <v-row no-gutters>
    <v-col>
      <v-toolbar flat color="white" height="55">
        <v-spacer />
        <v-btn fab variant="text" class="fs-lg" icon="" @click="prevFunc"> ＜ </v-btn>
        <v-spacer />
        <div class="text-center">
          <v-toolbar-title>
            {{ props.title }}
          </v-toolbar-title>
          <h5>{{ props.subtitle }}</h5>
        </div>
        <v-spacer />
        <v-btn fab variant="text" class="fs-lg" icon="" @click="nextFunc"> ＞ </v-btn>
        <v-spacer />
      </v-toolbar>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
const emits = defineEmits();
type Props = {
  title: string;
  subtitle: string;
};
const props = defineProps<Props>();

const prevFunc = () => {
  emits('prev');
};
const nextFunc = () => {
  emits('next');
};
</script>
