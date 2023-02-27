<template>
  <n-space inline>
    <n-text strong>입금받은금액</n-text>
    <n-input-number v-model:value="inputAmount" />
    <n-text strong>충전해야할금액</n-text>
    <n-text type="info">{{ chargeAmount.toLocaleString() }}</n-text>
  </n-space>
</template>

<script setup lang="ts">
import { feeCharge } from "@/constants";
import { ref, computed } from "vue";
const inputAmount = ref(0);
const chargeAmount = computed(
  () => inputAmount.value - inputAmount.value * (feeCharge / 100)
);
</script>
