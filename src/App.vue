<script setup lang="ts"></script>
<template>
  <n-message-provider placement="top-right">
    <n-loading-bar-provider>
      <n-dialog-provider>
        <main-view />
      </n-dialog-provider>
    </n-loading-bar-provider>
  </n-message-provider>
</template>

<style>
@import url("https://fonts.googleapis.com/css2?family=Nanum+Gothic:wght@400;700;800&display=swap");
#app {
  font-family: "Nanum Gothic", Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  width: 100%;
  height: 100%;
}
</style>
