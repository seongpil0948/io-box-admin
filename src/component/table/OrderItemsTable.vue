<script setup lang="ts">
import { OrderItemCombined, ORDER_STATE } from "@/composable";
import { toRefs, defineAsyncComponent } from "vue";

const PayAmountCard = defineAsyncComponent(
  () => import("@/component/card/PayAmountCard.vue")
);
const props = defineProps<{
  items: OrderItemCombined[];
}>();
const { items } = toRefs(props);
</script>

<template>
  <n-table striped size="small">
    <thead>
      <tr>
        <th>상태</th>
        <th>상품명</th>
        <th>주문/미송</th>
        <th>상품지불</th>
        <th>It's hard to learn words</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(item, i) in items" :key="i">
        <td>
          <n-popover trigger="hover">
            <template #trigger>
              <n-button> {{ ORDER_STATE[item.state] ?? item.state }} </n-button>
            </template>
            <n-card>
              <n-space vertical>
                <n-space>
                  <n-text strong>상품주문번호</n-text>
                  <n-text type="info"> {{ item.id }}</n-text>
                </n-space>
                <n-space>
                  <n-text strong>도매ID</n-text>
                  <n-text type="info"> {{ item.vendorId }}</n-text>
                </n-space>
                <n-space v-if="item.shipManagerId">
                  <n-text strong>엉클ID</n-text>
                  <n-text type="info"> {{ item.shipManagerId }}</n-text>
                </n-space>
              </n-space>
            </n-card>
          </n-popover>
        </td>
        <td>{{ item.shopProd.prodName }}</td>
        <td>{{ item.orderCnt }} / {{ item.pendingCnt }}</td>
        <td>
          <n-popover v-if="item.prodAmount" trigger="hover">
            <template #trigger>
              <n-button> {{ item.prodAmount.amount }} </n-button>
            </template>
            <PayAmountCard :amount="item.prodAmount" />
          </n-popover>
          <n-text v-else> - </n-text>
        </td>
      </tr>
    </tbody>
  </n-table>
</template>
