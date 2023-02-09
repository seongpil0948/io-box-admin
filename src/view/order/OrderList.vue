<script setup lang="ts">
import { ioFireStore } from "@/plugin/firebase";
import { formatDate, getIoCollectionGroup, loadDate } from "@io-boxies/js-lib";
import { IoOrder, orderFireConverter, ORDER_STATE } from "@/composable";
import { getDocs, query, where, Timestamp } from "@firebase/firestore";
import {
  NSpace,
  NDivider,
  NDatePicker,
  useMessage,
  DataTableColumns,
  NTag,
  NButton,
  NCard,
  NDataTable,
  NSelect,
  NText,
} from "naive-ui";
import { ref, watch, h, shallowRef } from "vue";
import { subDays, format, parseISO } from "date-fns";

const message = useMessage();
const stateOpt = Object.entries(ORDER_STATE).map(([en, ko]) => ({
  label: ko,
  value: en,
}));
const today = Date.now();
const startDate = subDays(today, 1);
const valueFormat = "yyyy-MM-dd";

const searchOpt = ref({
  createdRange: [startDate.valueOf(), today] as [number, number],
  states: [] as ORDER_STATE[],
});
function onChange(v: number) {
  message.info("onChange " + v);
}
function onClear() {
  message.info("onClear ");
}
function onConfirm(value: number | number[] | null) {
  message.info("onConfirm");
  console.log("Confirm-5 " + value);
  if (!Array.isArray(value)) return;
}
function onBlur() {
  message.warning("Blur-3");
}
const millisToDate = (d: number) => Timestamp.fromMillis(d).toDate();
async function onSearch() {
  const opt = searchOpt.value;
  console.log("onsearch", opt, opt.createdRange.map(millisToDate));
  const constraints = [];
  constraints.push(
    where(
      "createdAt.seconds",
      ">=",
      Timestamp.fromMillis(opt.createdRange[0]).seconds
    )
  );
  constraints.push(
    where(
      "createdAt.seconds",
      "<=",
      Timestamp.fromMillis(opt.createdRange[1]).seconds
    )
  );
  if (opt.states.length > 0) {
    constraints.push(where("states", "array-contains-any", opt.states));
  }
  console.log("constraints: ", constraints);
  const orderQ = query(
    getIoCollectionGroup(ioFireStore, "ORDER_PROD").withConverter(
      orderFireConverter
    ),
    ...constraints
  );
  const snap = await getDocs(orderQ);
  // dataFromSnap<IoOrder>(snap)
  orders.value = snap.docs.map((x) => x.data()).filter((x) => x);
  console.log("result: ", orders.value);
}
async function onSearchAll() {
  const snap = await getDocs(
    getIoCollectionGroup(ioFireStore, "ORDER_PROD").withConverter(
      orderFireConverter
    )
  );
  // dataFromSnap<IoOrder>(snap)
  orders.value = snap.docs.map((x) => x.data()).filter((x) => x);
}
watch(
  () => searchOpt.value,
  (val) => {
    if (val.states.length > 3) {
      val.states = val.states.slice(0, 3);
    }
  }
);
const orders = shallowRef<IoOrder[]>([]);
const orderColumns: DataTableColumns<IoOrder> = [
  {
    type: "selection",
  },
  {
    type: "expand",
    // expandable: (rowData) => rowData.name !== "Jim Green",
    renderExpand: (rowData) => {
      return h(
        NSpace,
        {},
        {
          default: [
            JSON.stringify(rowData.amount),
            JSON.stringify(rowData.items),
          ],
        }
      );
    },
  },
  {
    title: "주문상태",
    key: "states",
    render(row) {
      const tags = row.states.map((tagKey) => {
        return h(
          NTag,
          {
            style: {
              marginRight: "3px",
            },
            size: "small",
            type: "success",
            bordered: false,
          },
          {
            default: () => ORDER_STATE[tagKey] ?? tagKey,
          }
        );
      });
      return tags;
    },
  },
  {
    title: "생성일",
    key: "createdAt",
    render: (row) => formatDate(loadDate(row.createdAt), "MIN"),
  },
  {
    title: "Action",
    key: "actions",
    render(row) {
      return h(
        NButton,
        {
          size: "small",
          onClick: () => message.info(JSON.stringify(row)),
        },
        { default: () => "Send Email" }
      );
    },
  },
];
const orderRowKey = () => "dbId";
</script>
<template>
  <n-card title="주문 목록 페이지." style="width: 80vw">
    <n-space vertical>
      <n-date-picker
        v-model:value="searchOpt.createdRange"
        :value-format="valueFormat"
        type="datetimerange"
        clearable
        @blur="onBlur"
        @update:value="onChange"
        @clear="onClear"
        @confirm="onConfirm"
      />
      <n-select
        clearable
        placeholder="주문상태 선택"
        v-model:value="searchOpt.states"
        multiple
        :options="stateOpt"
      />
      <n-space justify="end">
        행 개수: <n-text type="info"> {{ orders.length }} </n-text>
        <n-button @click="onSearch"> 검색 </n-button>
        <n-button @click="onSearchAll"> 전체 검색 </n-button>
      </n-space>
      <n-divider />

      <n-data-table
        :row-key="orderRowKey"
        :columns="orderColumns"
        :data="orders"
        :pagination="{
          showSizePicker: true,
          pageSizes: [5, 10, 25, 50, 100],
        }"
      />
    </n-space>
  </n-card>
</template>
