<script setup lang="ts">
import { useCommonStore } from "@/store";
import { MenuOption, useLoadingBar, useMessage } from "naive-ui";
import { watch, watchPostEffect } from "vue";
import { renderIcon, renderRoute } from "@/util";
import { UserMultiple, HelpDesk } from "@vicons/carbon";
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
  {
    icon: renderIcon(HelpDesk),
    label: () => "Customer Service",
    key: "cs",
    children: [
      {
        label: () => renderRoute("CS 작성", "CsWrite"),
        key: "CsWrite",
      },
      {
        label: () => renderRoute("CS 목록", "CsPostList"),
        key: "CsPostList",
      },
    ],
  },
];
watch(
  () => cs.isLoading,
  (newVal) => {
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
  <n-layout has-sider :style="`min-height: ${minHeight};`">
    <io-sider :style="`min-height: ${minHeight}`" :menuOptions="menuOptions" />
    <n-spin size="large" :show="cs.showSpin">
      <div style="width: 100vw">
        <div style="width: 85vw; margin-left: 1vw">
          <router-view></router-view>
        </div>
      </div>
    </n-spin>
  </n-layout>
</template>