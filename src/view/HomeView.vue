<script setup lang="ts">
import { getPayCollection } from "@/composable";
import { getDocs } from "@firebase/firestore";
import { ref } from "vue";

const allBudget = ref(0);
const allPendingBudget = ref(0);
async function getAllCash() {
  allBudget.value = 0;
  allPendingBudget.value = 0;
  const snap = await getDocs(getPayCollection());
  snap.docs.forEach((doc) => {
    const d = doc.data();
    if (d) {
      allBudget.value += d.budget;
      allPendingBudget.value += d.pendingBudget;
    }
  });
}
</script>
<template>
  <n-space vertical>
    <n-h1>인아웃박스 관리자 페이지.</n-h1>
    <n-divider />
    <n-card>
      <n-space vertical align="start">
        모든 유저의 코인 목록 집계
        <n-button @click="getAllCash"> 받아오기(많이하지마셈) </n-button>
        <n-space justify="space-between">
          <n-text strong>총 보유금액</n-text>
          <n-text type="info">{{ allBudget }}</n-text>
        </n-space>
        <n-space justify="space-between">
          <n-text strong>총 보유 보류금액</n-text>
          <n-text type="info">{{ allPendingBudget }}</n-text>
        </n-space>
      </n-space>
    </n-card>
  </n-space>
</template>
