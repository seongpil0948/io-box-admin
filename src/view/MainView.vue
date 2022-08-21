<script setup lang="ts">
import { useCommonStore } from "@/store";
import { MenuOption, useLoadingBar, useMessage } from "naive-ui";
import { watch, watchPostEffect } from "vue";
import { renderIcon, renderRoute } from "@/util";
import { UserMultiple } from "@vicons/carbon";
// this view consumes Global State(common)
const cs = useCommonStore();
const loading = useLoadingBar();
const msg = useMessage();
const minHeight = "100vh";
const menuOptions: MenuOption[] = [
  {
    icon: renderIcon(UserMultiple),
    label: () => renderRoute("유저목록", "UserList"),
    key: "UserList",
  },
];
watch(
  () => cs.isLoading,
  (newVal) => {
    console.debug(null, "MainView watch in Loading");
    if (newVal) loading.start();
    else loading.finish();
  }
);

watchPostEffect(() => {
  for (let i = 0; i < cs.msgQueue.length; i++) {
    const q = cs.msgQueue[i];
    if (q.isError) {
      msg.error(q.content);
    } else {
      msg.info(q.content);
    }
  }
});
</script>
<template>
  <n-layout has-sider :style="`min-height: ${minHeight}`">
    <io-sider :style="`min-height: ${minHeight}`" :menuOptions="menuOptions" />
    <n-spin size="large" :show="cs.showSpin">
      <div style="padding: 1rem">
        <router-view></router-view>
      </div>
    </n-spin>
  </n-layout>
</template>
