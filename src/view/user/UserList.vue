<script setup lang="ts">
import {
  IoPay,
  IoPayCRT,
  IO_PAY_DB,
  IoUser,
  USER_ROLE,
  userFromJson,
  USER_DB,
  userFireConverter,
  getUserName,
  orderFireConverter,
  downloadOrders,
} from "@/composable";
import { getParentRef, IoFireApp } from "@io-boxies/js-lib";
import {
  doc,
  getDocs,
  query,
  QueryConstraint,
  runTransaction,
  where,
} from "@firebase/firestore";
import { useAlarm, UserSearchResult } from "@io-boxies/vue-lib";
import {
  DataTableColumns,
  NButton,
  NTag,
  useMessage,
  NInputNumber,
  useDialog,
  NDropdown,
  NSpace,
} from "naive-ui";
import {
  ref,
  h,
  computed,
  watch,
  shallowRef,
  defineAsyncComponent,
  watchEffect,
} from "vue";
import { API_URL } from "@/constants";
import {
  deletedPath,
  deleteFolder,
  getIoCollection,
  IoCollection,
  ioFireStore,
} from "@/plugin/firebase";
import { catchError } from "@/util";
import { getStorage } from "@firebase/storage";

interface MigrateDoc {
  doc: ReturnType<typeof doc>;
  data: any;
}

const SearchUserAuto = defineAsyncComponent(
  () => import("@/component/search-user-auto")
);

const { sendAlarm } = useAlarm();
const users = ref<IoUser[]>([]);
const uById: { [uid: string]: IoUser } = {};
watchEffect(() => {
  users.value.forEach((u) => {
    uById[u.userInfo.userId] = u;
  });
});
const msg = useMessage();

interface UserCombined extends IoUser, IoPayCRT {}
const tableData = shallowRef<UserCombined[]>([]);
watch(
  () => users.value,
  async (us) => {
    const d: typeof tableData.value = [];
    for (let i = 0; i < us.length; i++) {
      const user = us[i];
      const uid = user.userInfo.userId;
      const pay = await IO_PAY_DB.getIoPayByUser(uid);
      d.push(Object.assign({}, user, pay));
    }
    tableData.value = d;
  },
  { deep: true }
);

const target = ref<UserCombined | null>(null);
const showEditModal = computed(() => target.value !== null);
function updateModal(value: boolean) {
  if (!value) {
    target.value = null;
  }
}

async function submitModal() {
  if (!target.value) return msg.error("다시시도");
  const targetU = userFromJson(target.value);
  if (!targetU) return msg.error("다시시도");
  const existPay = await IO_PAY_DB.getIoPayByUser(targetU.userInfo.userId);
  const pay = new IoPay(target.value);
  console.log("exist Pay: ", existPay);
  console.log("new Pay: ", pay);
  dialog.warning({
    title: "정보 변경 확인",
    content: () =>
      h(
        NSpace,
        { vertical: true },
        {
          default: () => [
            `변경전: 금액(${existPay.budget}), 보류금액(${existPay.pendingBudget})`,
            `변경후: 금액(${pay.budget}), 보류금액(${pay.pendingBudget})`,
            `증분량: 금액(${pay.budget - existPay.budget}, 보류금액(${
              pay.pendingBudget - existPay.pendingBudget
            })`,
          ],
        }
      ),
    positiveText: "Sure",
    negativeText: "Not Sure",
    onPositiveClick: async () => {
      return Promise.all([
        USER_DB.updateUser(ioFireStore, targetU),
        existPay.updatePay("ADMIN_MODIFY", pay.budget, pay.pendingBudget),
      ])
        .then(() => {
          msg.info("성공");
          target.value = null;
        })
        .catch((err) => msg.error(`실패! ${JSON.stringify(err)}`));
    },
    onNegativeClick: () => {
      dialog.destroyAll();
    },
  });
}
const c = getIoCollection(ioFireStore, { c: IoCollection.USER }).withConverter(
  userFireConverter
);
async function getNoPass() {
  users.value = [];
  const snap = await getDocs(query(c, where("userInfo.passed", "!=", true)));
  console.info("snapshot count: ", snap.size);
  snap.docs.forEach((d) => {
    const data = d.data();
    if (data) {
      users.value.push(data);
    }
  });
}
async function downloadUserOrder(row: UserCombined) {
  users.value = [];
  const orderC = getIoCollection(ioFireStore, {
    c: "ORDER_PROD",
    uid: row.userInfo.userId,
  }).withConverter(orderFireConverter);
  const orderSnap = await getDocs(orderC);
  const orders = orderSnap.docs.map((x) => x.data()).filter((x) => x);
  const data = orders.flatMap((x) => x.items);

  const virUserC = getIoCollection(ioFireStore, {
    c: "VIRTUAL_USER",
    uid: row.userInfo.userId,
  }).withConverter(userFireConverter);

  const virUserSnap = await getDocs(virUserC);
  const virVendors = virUserSnap.docs.map((x) => x.data()).filter((x) => x);
  return downloadOrders(uById, data, virVendors as IoUser[]);
}
async function onSelectMenu(key: string | number, row: UserCombined) {
  msg.info(String(key));
  switch (key) {
    case "downloadOrder":
      downloadUserOrder(row);
      break;
    case "deleteUser":
      await handleDelete(row);
      break;
    case "editUser":
      target.value = row;
      break;
    case "detailUser":
      detailUserTarget.value = row;
      break;

    default:
      break;
  }
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
    .catch((err) => catchError({ err, msg, prefix: "유저 수정 실패" }));
}
const dialog = useDialog();
console.log("ioFireStore: ", ioFireStore);
async function handleDelete(u: UserCombined) {
  const d = dialog.warning({
    title: `유저 ${getUserName(u)} 삭제`,
    content: "real?",
    positiveText: "real!",
    negativeText: "cancel",
    onPositiveClick: async () => {
      console.log("in handleDelete");
      d.loading = true;
      const uid = u.userInfo.userId;
      const userRef = getParentRef({
        storage: getStorage(IoFireApp.getInst().app),
        svc: "USER",
        userId: uid,
      });
      return runTransaction(ioFireStore, async (transaction) => {
        const targets: MigrateDoc[] = [];
        const cs = ["USER", "MAPPER", "IO_PAY"] as IoCollection[];
        for (let i = 0; i < cs.length; i++) {
          const c = getIoCollection(ioFireStore, { c: cs[i], uid });
          const document = doc(c, uid);
          const snap = await transaction.get(document);
          if (snap.exists()) {
            console.info(`data ${cs} exist`);
            targets.push({ doc: document, data: snap.data() });
          }
        }
        // 다 삭제 주의...
        const verbose: { collection: IoCollection; field?: string }[] = [
          { collection: "SHOP_PROD", field: "shopId" },
          // { collection: "SHOP_PROD", field: "vendorId" }, 주문정보까지 삭제해야되서 이건 일단 제외
          { collection: "VENDOR_PROD", field: "vendorId" },
          { collection: "ORDER_PROD" },
          { collection: "ORDER_PROD_NUMBER" },
          { collection: "SHIPMENT" },
          { collection: "USER_LOG" },
          { collection: "TOKENS" },
          { collection: "VIRTUAL_ORDER_PROD" },
          { collection: "VIRTUAL_USER" },
          { collection: "VIRTUAL_VENDOR_PROD" },
        ];
        for (let k = 0; k < verbose.length; k++) {
          const v = verbose[k];
          const targetC = getIoCollection(ioFireStore, {
            c: v.collection,
            uid: uid,
          });
          const constraints: QueryConstraint[] = [];
          if (v.field) constraints.push(where(v.field, "==", uid));
          const targetSnap = await getDocs(query(targetC, ...constraints));
          console.info(`snap size: ${targetSnap.size} with`, v);
          targetSnap.docs.forEach((d) => {
            targets.push({ doc: doc(targetC, d.id), data: d.data() });
          });
        }
        for (let j = 0; j < targets.length; j++) {
          const md = targets[j];
          console.log(`path: ${md.doc.path}`);
          console.log(`deletedPath: ${deletedPath(md.doc.path)}`);
          transaction.set(doc(ioFireStore, deletedPath(md.doc.path)), md.data);
          transaction.delete(md.doc);
        }
        await deleteFolder(userRef);
        return targets;
      })
        .then((d) => {
          console.log("삭제성공: ", d);
          msg.success("삭제성공");
        })
        .catch((err) => {
          console.error(err);
          msg.error(`삭제실패 ${JSON.stringify(err)}`);
        })
        .finally(() => (d.loading = false));
    },
  });
}
const UserSummary = defineAsyncComponent(
  () => import("@/component/card/UserSummaryCard.vue")
);
const detailUserTarget = ref<IoUser | null>(null);
function onUpdateModal(val: boolean) {
  if (!val) {
    detailUserTarget.value = null;
  }
}
const columns: DataTableColumns<UserCombined> = [
  {
    title: "메뉴",
    key: "menu",
    render: (row) =>
      h(
        NDropdown,
        {
          trigger: "hover",
          onSelect: async (k) => await onSelectMenu(k, row),
          options: [
            {
              label: "주문정보 다운",
              key: "downloadOrder",
            },
            {
              label: "유저 삭제",
              key: "deleteUser",
            },
            {
              label: "유저 수정",
              key: "editUser",
            },
            {
              label: "유저 상세",
              key: "detailUser",
            },
          ],
        },
        { default: () => h(NButton, {}, { default: () => "선택끄" }) }
      ),
  },
  { title: "이름", key: "un", render: (row) => getUserName(row) },
  { title: "메일", key: "userInfo.email" },
  {
    title: "역할",
    key: "userInfo.role",
    render(row) {
      return h(NTag, {}, { default: () => USER_ROLE[row.userInfo.role] });
    },
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
  { title: "코인", key: "budget" },
  { title: "보류코인", key: "pendingBudget" },
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
const env = import.meta.env.MODE === "production" ? "io-prod" : "io-dev";
</script>
<template>
  <n-card>
    <template #header>
      <n-space>
        <n-button @click="getNoPass">미승인유저 불러오기</n-button>
        <SearchUserAuto
          :store="ioFireStore"
          :search-size="resultSize"
          :show-role-selector="false"
          :env="env"
          @on-result="onResult"
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
      :table-layout="'fixed'"
      :columns="columns"
      :data="tableData"
      :bordered="false"
      :pagination="{
        'show-size-picker': true,
        'page-sizes': [5, 10, 25, 50, 100],
      }"
    />
  </n-card>
  <n-modal v-if="target" :show="showEditModal" @update:show="updateModal">
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
  <n-modal
    :show="detailUserTarget !== null"
    :on-update:show="onUpdateModal"
    close-on-esc
  >
    <UserSummary :user="detailUserTarget!" />
  </n-modal>
</template>
