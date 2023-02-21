<script setup lang="ts">
import {
  getUserName,
  IoUser,
  ReqEncash,
  reqEncashConverter,
  useCalenderSearch,
  USER_DB,
} from "@/composable";
import { getIoCollection, ioFireStore } from "@/plugin/firebase";
import { uniqueArr } from "@/util/io-fns";
import { getDocs, orderBy, query } from "@firebase/firestore";
import { formatDate, loadDate } from "@io-boxies/js-lib";
import {
  useMessage,
  DropdownOption,
  NText,
  NButton,
  NDropdown,
} from "naive-ui";
import { TableColumns } from "naive-ui/es/data-table/src/interface";
import { defineAsyncComponent, h, ref, watch } from "vue";

const msg = useMessage();
const c = getIoCollection(ioFireStore, { c: "REQUEST_ENCASH" }).withConverter(
  reqEncashConverter
);
const encashList = ref<ReqEncash[]>([]);
async function onSearch() {
  const constraints = getConstraints();
  console.log("constraints: ", constraints);
  const q = query(c, ...constraints, orderBy("createdAt", "desc"));

  const snap = await getDocs(q);
  // dataFromSnap<IoOrder>(snap)
  encashList.value = snap.docs.map((x) => x.data()).filter((x) => x);
  console.log("result: ", encashList.value);
}

async function handlePostSelect(
  row: ReqEncash,
  key: string | number,
  option: DropdownOption
) {
  if (option.key === "approve") {
    msg.info("approved");
    console.info("approved", row, key);
    // reduce user budget && call payAgent
  }
}
const UserSummary = defineAsyncComponent(
  () => import("@/component/card/UserSummaryCard.vue")
);

const userByIds = ref<{ [userId: string]: IoUser }>({});
watch(
  () => encashList.value,
  async (val) => {
    const ids = uniqueArr(val.map((x) => x.userId));
    const users = await USER_DB.getUserByIds(
      ioFireStore,
      ids.filter((y) => !Object.keys(userByIds.value).includes(y))
    );
    users.forEach((u) => {
      userByIds.value[u.userInfo.userId] = u;
    });
  }
);
const detailUserTarget = ref<IoUser | null>(null);
const columns: TableColumns<ReqEncash> = [
  {
    title: "생성일",
    key: "createdAt",
    render: (row: any) =>
      h(
        NText,
        {},
        {
          default: () => {
            return formatDate(loadDate(row.createdAt), "MIN");
          },
        }
      ),
  },
  {
    title: "요청액",
    key: "amount",
  },
  {
    title: "요청액",
    key: "amount",
    render(row) {
      const u = userByIds.value[row.userId];
      return u ? getUserName(u) : "-";
    },
  },
  {
    title: "메뉴",
    key: "actions",
    render(row) {
      const btn = h(NButton, {}, { default: () => "..." });
      return h(
        NDropdown,
        {
          trigger: "click",
          options: [
            {
              label: "승인",
              key: "approve",
            },
          ],
          onSelect: (key: string | number, option: DropdownOption) =>
            handlePostSelect(row, key, option),
        },
        {
          default: () => btn,
        }
      );
    },
  },
  {
    title: "유저 상세",
    key: "userDetail",
    // render: (row) => renderAmount(userByIds.value[row.userId]),
    render: (row) =>
      h(
        NButton,
        {
          disabled: !userByIds.value[row.userId],
          onClick: () => {
            detailUserTarget.value = userByIds.value[row.userId];
          },
        },
        {
          default: () => "유저상세",
        }
      ),
  },
];
function onUpdateModal(val: boolean) {
  if (!val) {
    detailUserTarget.value = null;
  }
}
const {
  valueFormat,
  createdRange,
  onChange,
  onClear,
  onConfirm,
  onBlur,
  getConstraints,
} = useCalenderSearch();
</script>

<template>
  <n-space vertical item-style="width: 100%; height: 100%">
    <n-h1>EncashReqList</n-h1>
    <n-date-picker
      v-model:value="createdRange"
      :value-format="valueFormat"
      type="datetimerange"
      clearable
      @blur="onBlur"
      @update:value="onChange"
      @clear="onClear"
      @confirm="onConfirm"
    />
    <n-space justify="end">
      행 개수: <n-text type="info"> {{ encashList.length }} </n-text>
      <n-button @click="onSearch"> 검색 </n-button>
    </n-space>
    <n-data-table
      ref="table"
      :columns="columns"
      :data="encashList"
      :pagination="{
        showSizePicker: true,
        pageSizes: [5, 10, 25, 50],
      }"
    />
  </n-space>
  <n-modal
    :show="detailUserTarget !== null"
    :on-update:show="onUpdateModal"
    close-on-esc
  >
    <UserSummary :user="detailUserTarget!" />
  </n-modal>
</template>
