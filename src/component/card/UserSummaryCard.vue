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
import { toRefs, watch, shallowRef, defineAsyncComponent } from "vue";
const props = defineProps<{ user: IoUser | null }>();
const { user } = toRefs(props);
const pay = shallowRef<IoPay | null>(null);
const payHistory = shallowRef<PayHistoryCRT[]>([]);

const UserLocateList = defineAsyncComponent(
  () => import("@/component/card/UserLocateList.vue")
);
const getC = (uid: string) =>
  getIoCollection(ioFireStore, {
    c: "PAY_HISTORY",
    uid,
  }).withConverter(fireConverter<PayHistoryCRT>());
watch(
  () => user.value,
  async (u) => {
    if (!u || !u.userInfo) return;
    pay.value = await IO_PAY_DB.getIoPayByUser(u.userInfo.userId);
    const docsRef = await getDocs(
      query(getC(u.userInfo.userId), orderBy("createdAt", "desc"), limit(50))
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
    <n-tabs v-if="user" type="line" animated>
      <n-tab-pane name="userInfo" tab="유저 기본 정보">
        <n-grid
          cols="1 s:2 m:2 l:3 xl:4 2xl:4"
          x-gap="24"
          y-gap="12"
          responsive="screen"
          style="margin-bottom: 2%"
        >
          <n-grid-item>
            <n-text strong>유저 이름: </n-text>
            <n-text type="info">{{ getUserName(user) }}</n-text>
          </n-grid-item>
          <n-grid-item>
            <n-text strong>이메일:</n-text>
            <n-text type="info">{{ user.userInfo.email ?? "-" }}</n-text>
          </n-grid-item>
          <n-grid-item>
            <n-text strong>휴대폰: </n-text>
            <n-text type="info">{{ user.userInfo.phone ?? "-" }}</n-text>
          </n-grid-item>
          <n-grid-item v-if="user.userInfo.account">
            <n-text strong>
              {{ user.userInfo.account.bank }} /
              {{ user.userInfo.account.accountName }} <br />
            </n-text>
            <n-text type="info">{{
              user.userInfo.account.accountNumber
            }}</n-text>
          </n-grid-item>
          <n-grid-item v-else> 계좌정보 없슴 </n-grid-item>
          <n-grid-item>
            <n-text strong>유저 ID: </n-text>
            <n-text type="info">{{ user.userInfo.userId }}</n-text>
          </n-grid-item>
          <n-grid-item>
            <n-text strong>가입경로: </n-text>
            <n-text type="info">{{ user.userInfo.providerId }}</n-text>
          </n-grid-item>
          <n-grid-item>
            <n-text strong>연락처: </n-text>
            <n-text type="info">{{ user.userInfo.phone }}</n-text>
          </n-grid-item>
          <n-grid-item v-if="user.userInfo.managerId">
            <n-text strong>엉클관리자 ID: </n-text>
            <n-text type="info">{{ user.userInfo.managerId }}</n-text>
          </n-grid-item>
          <n-grid-item>
            <n-text strong>회사이름: </n-text>
            <n-text type="info">{{
              user.companyInfo?.companyName ?? "-"
            }}</n-text>
          </n-grid-item>
          <n-grid-item>
            <n-text strong>회사 연락처: </n-text>
            <n-text type="info">{{
              user.companyInfo?.companyPhone ?? "-"
            }}</n-text>
          </n-grid-item>
          <n-grid-item>
            <n-text strong>CEO 이름: </n-text>
            <n-text type="info">{{ user.companyInfo?.ceoName ?? "-" }}</n-text>
          </n-grid-item>
          <n-grid-item>
            <n-text strong>CEO 연락처: </n-text>
            <n-text type="info">{{ user.companyInfo?.ceoPhone ?? "-" }}</n-text>
          </n-grid-item>
          <n-grid-item>
            <n-text strong>사업자 등록번호: </n-text>
            <n-text type="info">{{
              user.companyInfo?.companyNo ?? "-"
            }}</n-text>
          </n-grid-item>
          <n-grid-item>
            <n-space align="start">
              <n-text strong>사업자 등록증: </n-text>
              <n-image
                v-for="(val, idx) in user.companyInfo?.companyCertificate ?? []"
                :key="idx"
                :height="150"
                :src="val"
              ></n-image>
            </n-space>
          </n-grid-item>
          <n-grid-item>
            <n-text v-if="user.companyInfo?.shipLocate" strong
              >쇼핑몰링크:
              <n-text type="info">
                {{ user.companyInfo?.shipLocate.alias }}
              </n-text></n-text
            >

            <n-text v-else> 대표 배송지 없음 </n-text>
          </n-grid-item>
          <n-grid-item v-if="user.companyInfo">
            <n-text strong>배송지 목록: </n-text>
            <user-locate-list :info="user.companyInfo" :readonly="true" />
          </n-grid-item>
          <n-grid-item>
            <n-text strong>쇼핑몰링크: </n-text>
            <n-text type="info">{{ user.companyInfo?.shopLink ?? "-" }}</n-text>
          </n-grid-item>
          <n-grid-item>
            <n-text strong>담당자이름: </n-text>
            <n-text type="info">{{
              user.companyInfo?.managerName ?? "-"
            }}</n-text>
          </n-grid-item>
          <n-grid-item>
            <n-text strong>담당자 연락처: </n-text>
            <n-text type="info">{{
              user.companyInfo?.managerPhone ?? "-"
            }}</n-text>
          </n-grid-item>
        </n-grid>
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
