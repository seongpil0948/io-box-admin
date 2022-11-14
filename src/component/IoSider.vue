<script setup lang="ts">
import { ref, toRefs } from "vue";
import type { MenuOption } from "naive-ui";
import { useAuthStore } from "@/store";

const props = defineProps<{
  menuOptions: MenuOption[];
}>();
const { menuOptions } = toRefs(props);
const collapsed = ref(false);
const auth = useAuthStore();
</script>

<template>
  <n-layout-sider
    bordered
    show-trigger
    collapse-mode="width"
    :collapsed-width="64"
    :width="240"
    :native-scrollbar="false"
    v-model:collapsed="collapsed"
    style="height: 100%"
  >
    <n-space justify="center" align="center">
      <logo-image
        @click="$router.push('/')"
        size="3.5rem"
        style="padding-top: 0.5rem"
      />
      <n-p v-if="auth.currUser">{{ auth.currUser.name }} 님 반갑습니다.</n-p>
      <n-h2
        :style="`${
          collapsed ? 'transform: skew(-9deg, 33deg);' : 'none'
        } ; margin-bottom: -7%`"
        >InOut BOX</n-h2
      >
    </n-space>

    <n-divider />
    <n-menu
      :collapsed-width="64"
      :collapsed-icon-size="22"
      :options="menuOptions"
    />
  </n-layout-sider>
</template>
