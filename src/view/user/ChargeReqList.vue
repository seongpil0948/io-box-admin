<script setup lang="ts">
import {
  getUserName,
  IoUser,
  ReqEncash,
  reqEncashConverter,
  useCalenderSearch,
  USER_DB,
} from "@/composable";
import { feeCharge } from "@/constants";
import { getIoCollection, ioFireStore } from "@/plugin/firebase";
import { catchError } from "@/util";
import { uniqueArr } from "@/util/io-fns";
import {
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from "@firebase/firestore";
import { formatDate, loadDate } from "@io-boxies/js-lib";
import {
  DropdownOption,
  NText,
  NButton,
  NDropdown,
  NInput,
  useMessage,
} from "naive-ui";
import { TableColumns } from "naive-ui/es/data-table/src/interface";
import { defineAsyncComponent, h, ref, watch } from "vue";

const msg = useMessage();
const c = getIoCollection(ioFireStore, { c: "REQUEST_CHARGE" }).withConverter(
  reqEncashConverter
);
const chargeList = ref<ReqEncash[]>([]);
async function onSearch(filterDone: boolean) {
  let constraints = getConstraints();
  if (filterDone) {
    constraints = [where("isDone", "!=", true), orderBy("isDone")];
  }
  console.log("constraints: ", constraints);
  const q = query(c, ...constraints);

  const snap = await getDocs(q);
  chargeList.value = snap.docs.map((x) => x.data()).filter((x) => x);
  console.log("result: ", chargeList.value);
}

const UserSummary = defineAsyncComponent(
  () => import("@/component/card/UserSummaryCard.vue")
);

const userByIds = ref<{ [userId: string]: IoUser }>({});
watch(
  () => chargeList.value,
  async (val) => {
    const targetIds = uniqueArr(val.map((x) => x.userId)).filter(
      (y) => !Object.keys(userByIds.value).includes(y)
    );
    const users = await USER_DB.getUserByIds(ioFireStore, targetIds);
    users.forEach((u) => {
      userByIds.value[u.userInfo.userId] = u;
    });
  }
);
const detailUserTarget = ref<IoUser | null>(null);
const columns: TableColumns<ReqEncash> = [
  {
    type: "expand",
    expandable: (rowData) => typeof rowData.adminMemo === "string",
    renderExpand: (rowData) => {
      return rowData.adminMemo ? rowData.adminMemo : "-";
    },
  },
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
    title: "결제금액",
    key: "mustAmount",
    render(row) {
      return row.amount + row.amount * (feeCharge / 100);
    },
  },
  {
    title: "요청액",
    key: "amount",
  },

  {
    title: "닉네임",
    key: "userName",
    render(row) {
      const u = userByIds.value[row.userId];
      return u ? getUserName(u) : "-";
    },
  },

  {
    title: "상태",
    key: "result",
    render: (row) =>
      h(
        NText,
        {
          type:
            row.result === "approve"
              ? "success"
              : row.result === "rejected"
              ? "error"
              : "default",
        },
        {
          default: () => {
            if (!row.result) return "대기중";
            return row.result === "approve" ? "완료" : "반려";
          },
        }
      ),
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
            {
              label: "반려",
              key: "reject",
            },
          ],
          onSelect: async (key: string | number, option: DropdownOption) => {
            const u = userByIds.value[row.userId];
            if (!u) return msg.error("유저를 찾을수 없습니다.");
            if (option.key === "approve") {
              console.info("approved", row, key, u);
              const receipt: any = {
                approvedAt: new Date(),
                isDone: true,
                result: "approve",
              };
              if (row.adminMemo) {
                receipt["adminMemo"] = row.adminMemo;
              }
              updateDoc(doc(c, row.dbId), receipt)
                .then(() => {
                  msg.success("성공");
                })
                .catch((err) =>
                  catchError({ err, msg, prefix: "데이터 처리 실패" })
                );
            } else if (option.key === "reject") {
              console.info("rejected", row, key, u);
              updateDoc(doc(c, row.dbId), {
                rejectedAt: new Date(),
                isDone: true,
                adminMemo: row.adminMemo ?? "",
                result: "rejected",
              })
                .then(() => {
                  msg.success("성공");
                })
                .catch((err) =>
                  catchError({ err, msg, prefix: "데이터 처리 실패" })
                );
            }
          },
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
  {
    title: "메모 입력",
    key: "memo",
    // render: (row) => renderAmount(userByIds.value[row.userId]),
    render: (row) =>
      h(
        NInput,
        {
          value: row.adminMemo,
          onUpdateValue: (val) => {
            row.adminMemo = val;
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
    <n-card>
      <n-h3>Charge Request List</n-h3>
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
      <n-space justify="end" style="padding: 1% 5%; padding-right: 10%">
        <charge-calculator />
        행 개수: <n-text type="info"> {{ chargeList.length }} </n-text>
        <n-button @click="() => onSearch(false)"> 검색 </n-button>
        <n-button @click="() => onSearch(true)"> 미해결 검색 </n-button>
      </n-space>
      <n-data-table
        ref="table"
        :columns="columns"
        :data="chargeList"
        :pagination="{
          showSizePicker: true,
          pageSizes: [5, 10, 25, 50],
        }"
      />
    </n-card>
  </n-space>
  <n-modal
    :show="detailUserTarget !== null"
    :on-update:show="onUpdateModal"
    close-on-esc
  >
    <UserSummary :user="detailUserTarget!" />
  </n-modal>
</template>
