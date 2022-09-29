<script setup lang="ts">
import {
  IoPay,
  IoPayCRT,
  IoUser,
  IoUserCRT,
  IO_PAY_DB,
  USER_ROLE,
} from "@/composable";
import { getIoCollection, IoCollection } from "@/util";
import { getDocs } from "@firebase/firestore";
import { DataTableColumns, NButton, NTag, useMessage } from "naive-ui";
import { onBeforeMount, ref, h, computed } from "vue";

const users = ref<IoUser[]>([]);
const msg = useMessage();
const payList = IO_PAY_DB.getIoPaysListen();
interface UserCombined extends IoUserCRT, IoPayCRT {}
const data = computed(() => {
  const u: UserCombined[] = [];
  for (let i = 0; i < users.value.length; i++) {
    const user = users.value[i];
    const uid = user.userInfo.userId;
    const pay =
      payList.value.find((x) => x.userId === uid) ?? IoPay.initial(uid);
    u.push(Object.assign({}, pay, user));
  }
  return u;
});
const target = ref<UserCombined | null>(null);
const showEditModal = computed(() => target.value !== null);
function updateModal(value: boolean) {
  if (!value) {
    target.value = null;
  }
}
async function submitModal() {
  if (!target.value) return msg.error("target UserCombined is null");
  const u = new IoUser(target.value);
  const pay = new IoPay(target.value);
  console.log("new pay: ", pay);
  Promise.all([u.update(), pay.update()])
    .then(() => {
      msg.info("성공");
      target.value = null;
    })
    .catch((err) => msg.error(`실패! ${JSON.stringify(err)}`));
}
async function getUsers() {
  const c = getIoCollection({ c: IoCollection.USER }).withConverter(
    IoUser.fireConverter()
  );
  const snap = await getDocs(c);
  snap.docs.forEach((d) => {
    const data = d.data();
    if (data) {
      users.value.push(data);
    }
  });
}
onBeforeMount(async () => {
  await getUsers();
});
async function onPasseUpdate(user: UserCombined) {
  user.userInfo.passed = !user.userInfo.passed;
  const u = new IoUser(user);
  u.update()
    .then(() => msg.success("수정완료"))
    .catch(() => msg.error("수정실패"));
}
const columns: DataTableColumns<UserCombined> = [
  {
    title: "ID",
    key: "userInfo.userId",
  },
  {
    title: "이름",
    key: "userInfo.userName",
  },
  {
    title: "역할",
    key: "userInfo.role",
    render(row) {
      return h(NTag, {}, { default: () => USER_ROLE[row.userInfo.role] });
    },
  },
  {
    title: "연락처",
    key: "userInfo.phone",
  },
  {
    title: "허가여부",
    key: "passed",
    render(row) {
      return h(
        NButton,
        {
          strong: true,
          tertiary: true,
          size: "small",
          type: row.userInfo.passed ? "primary" : "error",
          onClick: () => onPasseUpdate(row),
        },
        { default: () => (row.userInfo.passed ? "허가" : "불허") }
      );
    },
  },
  {
    title: "",
    key: "edit",
    render(row) {
      return h(
        NButton,
        {
          strong: true,
          tertiary: true,
          size: "small",
          onClick: () => {
            target.value = row;
          },
        },
        { default: () => "정보수정" }
      );
    },
  },
  {
    title: "회사이름",
    key: "companyInfo.companyName",
  },
  {
    title: "회사연락처",
    key: "companyInfo.companyPhone",
  },
  {
    title: "코인",
    key: "budget",
  },
  {
    title: "보류코인",
    key: "pendingBudget",
  },
];
</script>
<template>
  <n-h1>인아웃박스 유저목록. ({{ users.length }})</n-h1>
  <n-data-table :columns="columns" :data="data" />
  <n-modal :show="showEditModal" @update:show="updateModal" v-if="target">
    <n-card style="width: 600px" title="유저정보수정" :bordered="false">
      <n-space justify="space-between">
        <n-text type="info"> 코인 </n-text>
        <n-input-number v-model:value="target.budget" :min="0" />
      </n-space>
      <n-space style="margin-top: 1vh" justify="space-between">
        <n-text type="info"> 보류코인 </n-text>
        <n-input-number v-model:value="target.pendingBudget" :min="0" />
      </n-space>

      <template #action>
        <n-space justify="end">
          <n-button @click="submitModal">제출</n-button>
        </n-space>
      </template>
    </n-card>
  </n-modal>
</template>
