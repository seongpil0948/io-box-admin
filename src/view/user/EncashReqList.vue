<script setup lang="ts">
import {
  getUserName,
  IoUser,
  ReqEncash,
  useCalenderSearch,
  useEncash,
  USER_DB,
} from "@/composable";
import { ioFireStore } from "@/plugin/firebase";
import { uniqueArr } from "@/util/io-fns";
import { getDocs, orderBy, query, where } from "@firebase/firestore";
import { formatDate, loadDate } from "@io-boxies/js-lib";
import { DropdownOption, NText, NButton, NDropdown, NInput } from "naive-ui";
import { TableColumns } from "naive-ui/es/data-table/src/interface";
import { defineAsyncComponent, h, ref, watch } from "vue";
import { utils, writeFile } from "xlsx";

const { msg, approveEncash, c, rejectEncash } = useEncash();
const userByIds = ref<{ [userId: string]: IoUser }>({});
const encashList = ref<ReqEncash[]>([]);
watch(
  () => encashList.value,
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
async function downloadAmountObj() {
  console.log("encashList: ", encashList.value);
  const json = encashList.value.map((x) => {
    const acc = userByIds.value[x.userId].userInfo.account!;
    return {
      출금요청금액: x.amount,
      계좌번호: acc.accountNumber,
      은행명: acc.bank,
      예금주명: acc.accountName,
      생성일: formatDate(loadDate(x.createdAt), "MIN"),
      메모: x.adminMemo ?? "",
    };
  });
  const date = new Date();
  const fileName = `encash_${date.toLocaleString()}.xlsx`;
  const worksheet = utils.json_to_sheet(json);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "Dates");
  writeFile(workbook, fileName);
}

async function onSearch(filterDone: boolean) {
  let constraints = getConstraints();
  if (filterDone) {
    constraints = [where("isDone", "!=", true), orderBy("isDone")];
  }
  console.log("constraints: ", constraints);
  const q = query(c, ...constraints);

  const snap = await getDocs(q);
  // dataFromSnap<IoOrder>(snap)
  encashList.value = snap.docs.map((x) => x.data()).filter((x) => x);
  console.log("result: ", encashList.value);
  // updatePay
}

const UserSummary = defineAsyncComponent(
  () => import("@/component/card/UserSummaryCard.vue")
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
          onSelect: (key: string | number, option: DropdownOption) => {
            const u = userByIds.value[row.userId];
            const account = u?.userInfo.account;
            if (!u) return msg.error("유저를 찾을수 없습니다.");
            else if (
              !account ||
              !account.code ||
              !account.bank ||
              !account.accountName ||
              !account.accountNumber ||
              account.accountNumber.length < 3
            )
              return msg.error("유효하지 않은 계좌정보 .");
            if (option.key === "approve") {
              console.info("approved", row, key, u);
              approveEncash(row, account);
            } else if (option.key === "reject") {
              console.info("rejected", row, key, u);
              rejectEncash(row);
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
      <n-h3>EncashReqList</n-h3>
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
        행 개수: <n-text type="info"> {{ encashList.length }} </n-text>
        <n-button @click="() => onSearch(false)"> 검색 </n-button>
        <n-button @click="() => onSearch(true)"> 미해결 검색 </n-button>
        <n-button @click="() => downloadAmountObj()">
          테이블 엑셀다운
        </n-button>
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
      <n-p>메모는 승인 또는 거절시 반영됩니다.</n-p>
      <n-p>
        "유저 코인은 차감 되었지만, 송금 과정에서 문제가 발생했습니다." 에러
        발생시 수동으로 송금 해줘야 합니다.
      </n-p>
      <n-p>
        "유저 보유금액(코인) 차감 실패" 에러 발생시 수동으로 송금 및 개발자에게
        해당행과 함께 전달 해줘야 합니다.
      </n-p>
      <n-text strong type="error">
        걍 뭔가 싸하면 01071840948 콜때리고 해당행 보존해주세요.
      </n-text>
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
