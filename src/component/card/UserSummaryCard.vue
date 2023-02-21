<script setup lang="ts">
import {
  getUserName,
  IoPay,
  IoUser,
  IO_PAY_DB,
  PayHistoryCRT,
  PAY_HIST_STATE,
} from "@/composable";
import { getIoCollection, ioFireStore } from "@/plugin/firebase";
import { fireConverter } from "@/util";
import { formatDate, loadDate } from "@/util/date";
import { getDocs, limit, orderBy, query } from "@firebase/firestore";
import { toRefs, watch, shallowRef } from "vue";
const props = defineProps<{ user: IoUser }>();
const { user } = toRefs(props);
const pay = shallowRef<IoPay | null>(null);
const payHistory = shallowRef<PayHistoryCRT[]>([]);
watch(
  () => user.value,
  async (u) => {
    pay.value = await IO_PAY_DB.getIoPayByUser(u.userInfo.userId);
    const docsRef = await getDocs(
      query(
        getIoCollection(ioFireStore, {
          c: "PAY_HISTORY",
          uid: u.userInfo.userId,
        }).withConverter(fireConverter<PayHistoryCRT>()),
        orderBy("createdAt", "desc"),
        limit(50)
      )
    );
    const history: typeof payHistory.value = [];
    docsRef.docs.forEach((d) => {
      const data = d.data();
      if (data) history.push(data);
    });
    payHistory.value = history;
  },
  { immediate: true }
);
</script>

<template>
  <n-card title="유저 상세정보">
    <n-tabs type="line" animated>
      <n-tab-pane name="userInfo" tab="유저 기본 정보">
        <n-space vertical>
          <n-space justify="space-around">
            <n-text strong>유저 이름: </n-text>
            <n-text type="info">{{ getUserName(user) }}</n-text>
          </n-space>
          <n-space v-if="user.userInfo.email" justify="space-around">
            <n-text strong>이메일:</n-text>
            <n-text type="info">{{ user.userInfo.email }}</n-text>
          </n-space>
          <n-space v-if="user.userInfo.phone" justify="space-around">
            <n-text strong>휴대폰: </n-text>
            <n-text type="info">{{ user.userInfo.phone }}</n-text>
          </n-space>
          <n-space v-if="user.userInfo.account" justify="space-around">
            <n-text strong>
              {{ user.userInfo.account.bank }} /
              {{ user.userInfo.account.accountName }} <br />
            </n-text>
            <n-text type="info">{{
              user.userInfo.account.accountNumber
            }}</n-text>
          </n-space>
        </n-space>
      </n-tab-pane>
      <n-tab-pane v-if="pay" name="cashHistory" tab="Cash History">
        <n-space vertical>
          <n-space>
            <n-text strong>보유/보류 금액: </n-text>
            <n-text type="info"
              >{{ pay.budget }} / {{ pay.pendingBudget }}</n-text
            >
          </n-space>

          <n-table striped>
            <thead>
              <tr>
                <th>발생일</th>
                <th>요인</th>
                <th>금액</th>
                <th>보류금액</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(h, idx) in payHistory" :key="idx">
                <td>{{ formatDate(loadDate(h.createdAt), "MIN") }}</td>
                <td>{{ PAY_HIST_STATE[h.state] }}</td>
                <td>{{ h.amount }}</td>
                <td>{{ h.pendingAmount }}</td>
              </tr>
            </tbody>
          </n-table>
        </n-space>
      </n-tab-pane>
    </n-tabs>
  </n-card>
</template>
