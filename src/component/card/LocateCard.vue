<template>
  <n-card style="width: 25vw" title="주소지 정보">
    <n-space v-for="(j, idx2) in locateKey" :key="idx2 + '2'">
      <n-text type="info">
        {{ j[0] }}
      </n-text>
      <n-text type="primary">
        {{ locate[j[1]] }}
      </n-text>
    </n-space>
  </n-card>
</template>

<script setup lang="ts">
import { Locate } from "@/composable";
import { toRefs } from "vue";

const props = defineProps<{ locate: Locate }>();
const { locate } = toRefs(props);

const locateKey = [
  ["도시", "city"],
  ["우편번호", "postalCode"],
  ["상세주소", "detailLocate"],
  ["성", "firstName"],
  ["이름", "lastName"],
  ["핸드폰번호", "phone"],
] as [i: string, j: keyof Locate][];
</script>
