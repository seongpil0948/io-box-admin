<script setup lang="ts">
import { IoPay, IoPayCRT, IO_PAY_DB } from "@/composable";
import {
  IoUser,
  USER_ROLE,
  userFromJson,
  USER_DB,
  userFireConverter,
} from "@io-boxies/js-lib";
import { getDocs } from "@firebase/firestore";
import { getIoCollection, getUserName, IoCollection } from "@io-boxies/js-lib";
import { useAlarm, UserSearchResult } from "@io-boxies/vue-lib";
import {
  DataTableColumns,
  NButton,
  NTag,
  useMessage,
  NInputNumber,
} from "naive-ui";
import { ref, h, computed, watch, shallowRef, defineAsyncComponent } from "vue";
import { API_URL } from "@/constants";
import { ioFireStore } from "@/plugin/firebase";

const SearchUserAuto = defineAsyncComponent(
  () => import("@/component/search-user-auto")
);

const { sendAlarm } = useAlarm();
const users = ref<IoUser[]>([]);
const msg = useMessage();
const payList: { [uid: string]: IoPay } = {};
watch(
  () => users.value,
  async (us) => {
    for (let i = 0; i < us.length; i++) {
      const uid = us[i].userInfo.userId;
      if (!payList[uid]) {
        payList[uid] = await IO_PAY_DB.getIoPayByUser(uid);
      }
    }
  }
);

interface UserCombined extends IoUser, IoPayCRT {}
const data = computed(() => {
  const u: UserCombined[] = [];
  for (let i = 0; i < users.value.length; i++) {
    const user = users.value[i];
    const uid = user.userInfo.userId;
    const pay = payList[uid] ?? IoPay.initial(uid);
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
  if (!target.value) return msg.error("다시시도");
  const u = userFromJson(target.value);
  if (!u) return msg.error("다시시도");
  const pay = new IoPay(target.value);

  Promise.all([USER_DB.updateUser(ioFireStore, u), pay.update()])
    .then(() => {
      msg.info("성공");
      target.value = null;
    })
    .catch((err) => msg.error(`실패! ${JSON.stringify(err)}`));
}
const c = getIoCollection(ioFireStore, { c: IoCollection.USER }).withConverter(
  userFireConverter
);
async function getAllUsers() {
  users.value = [];
  const snap = await getDocs(c);
  snap.docs.forEach((d) => {
    const data = d.data();
    if (data) {
      users.value.push(data);
    }
  });
}

async function onPasseUpdate(user: UserCombined) {
  user.userInfo.passed = !user.userInfo.passed;
  USER_DB.updateUser(ioFireStore, user)
    .then(async () => {
      msg.success("수정완료");
      if (user.userInfo.passed) {
        await sendAlarm({
          toUserIds: [user.userInfo.userId],
          subject: `inoutbox 회원 승인 알림.`,
          body: `<p> ${getUserName(
            user
          )}님 계정 승인이 완료 되었습니다!</p> <p> 즐거운 이용 되세요!</p>`,
          notiLoadUri: "/",
          uriArgs: {},
          sendMailUri: `${API_URL}/mail/sendEmail`,
          pushUri: `${API_URL}/msg/sendPush`,
        });
      }
    })
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
const resultSize = 20;
const results = shallowRef<UserSearchResult[]>([]);
function onResult(result: UserSearchResult[]) {
  results.value = result;
}
async function loadResults() {
  users.value = await USER_DB.getUserByIds(
    ioFireStore,
    results.value.map((x) => x.id)
  );
}
</script>
<template>
  <n-card>
    <template #header>
      <n-space>
        <n-button @click="getAllUsers">전체 유저 불러오기</n-button>
        <SearchUserAuto
          :store="ioFireStore"
          @on-result="onResult"
          :search-size="resultSize"
          :show-role-selector="false"
          env="io-prod"
        />
        <n-button @click="loadResults">검색</n-button>
      </n-space>
    </template>
    <template #header-extra>
      <n-space>
        <n-text>검색 결과 개수 조정 </n-text>
        <NInputNumber v-model:value="resultSize" />
      </n-space>
    </template>
    <n-data-table
      :columns="columns"
      :data="data"
      :bordered="false"
      :pagination="{
        'show-size-picker': true,
        'page-sizes': [5, 10, 25, 50, 100],
      }"
    />
  </n-card>
  <n-modal :show="showEditModal" @update:show="updateModal" v-if="target">
    <n-card style="width: 600px" title="유저정보수정" :bordered="false">
      <n-space justify="space-between">
        <n-text type="info"> 유저 ID </n-text>
        <n-text> {{ target.userInfo.userId }} </n-text>
      </n-space>
      <n-space style="margin-top: 1vh" justify="space-between">
        <n-text type="info"> 유저 </n-text>
        <n-text> {{ getUserName(target) ?? target.userInfo.email }} </n-text>
      </n-space>
      <n-space style="margin-top: 1vh" justify="space-between">
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
