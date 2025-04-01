<template>
  <v-app>
    <v-locale-provider locale="ja" class="h-100">
      <NuxtPwaManifest />
      <NuxtLayout class="h-100">
        <NuxtPage />
      </NuxtLayout>
    </v-locale-provider>
  </v-app>
</template>
