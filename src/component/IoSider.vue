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

async function onLogout() {
  await auth.logout();
}
</script>

<template>
  <n-layout-sider
    bordered
    show-trigger
    collapse-mode="width"
    :collapsed-width="100"
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
    <n-divider />
    <n-space vertical justify="center" align="center">
      <n-avatar
        v-if="auth.currUser && auth.currUser.userInfo.profileImg"
        round
        size="large"
        :src="auth.currUser.userInfo.profileImg"
      />
      <n-text v-if="auth.currUser">
        <!-- FIXME: affected by interface(it use getter) -->
        {{ auth.currUser.name }}
      </n-text>

      <n-button @click="onLogout">Sign out</n-button>
    </n-space>
  </n-layout-sider>
</template>
