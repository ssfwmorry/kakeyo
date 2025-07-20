<template>
  <v-app class="app-touch">
    <v-locale-provider locale="ja">
      <NuxtPwaManifest />
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </v-locale-provider>
  </v-app>
</template>

<style scoped lang="scss">
.app-touch {
  // スマホ環境でのダブルタップを無効化する
  touch-action: manipulation;
}
</style>
