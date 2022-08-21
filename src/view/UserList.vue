<script setup lang="ts">
import { IoUser, USER_ROLE } from "@/composable";
import { getIoCollection, IoCollection } from "@/util";
import { getDocs } from "@firebase/firestore";
import { DataTableColumns, NButton, NTag, useMessage } from "naive-ui";
import { onBeforeMount, ref, h } from "vue";

const users = ref<IoUser[]>([]);
const msg = useMessage();

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
async function onPasseUpdate(user: IoUser) {
  user.userInfo.passed = !user.userInfo.passed;
  user
    .update()
    .then(() => msg.success("수정완료"))
    .catch(() => msg.error("수정실패"));
}
const columns: DataTableColumns<IoUser> = [
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
    title: "회사이름",
    key: "companyInfo.companyName",
  },
  {
    title: "회사연락처",
    key: "companyInfo.companyPhone",
  },
];
</script>
<template>
  <n-h1>인아웃박스 유저목록. ({{ users.length }})</n-h1>
  <n-data-table :columns="columns" :data="users" />
</template>
