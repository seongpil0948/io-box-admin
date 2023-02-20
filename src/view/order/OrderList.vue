<script setup lang="ts">
import { ioFireStore } from "@/plugin/firebase";
import { formatDate, getIoCollectionGroup, loadDate } from "@io-boxies/js-lib";
import {
  IoOrder,
  orderFireConverter,
  OrderItemCombined,
  ORDER_STATE,
  PayAmount,
  useCalenderSearch,
} from "@/composable";
import { getDocs, query, where } from "@firebase/firestore";
import {
  NSpace,
  NDivider,
  NDatePicker,
  DataTableColumns,
  NTag,
  NButton,
  NCard,
  NDataTable,
  NSelect,
  NText,
  NPopover,
} from "naive-ui";
import { ref, watch, h, shallowRef, defineAsyncComponent } from "vue";

const stateOpt = Object.entries(ORDER_STATE).map(([en, ko]) => ({
  label: ko,
  value: en,
}));
const states = ref<ORDER_STATE[]>([]);
const {
  message,
  valueFormat,
  createdRange,
  onChange,
  onClear,
  onConfirm,
  onBlur,
  getConstraints,
} = useCalenderSearch();
async function onSearch() {
  const constraints = getConstraints("od.createdAt");
  if (states.value.length > 0) {
    constraints.unshift(where("states", "array-contains-any", states.value));
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
watch(
  () => states.value,
  (val) => {
    if (val.length > 3) {
      val = val.slice(0, 3);
    }
  }
);

const orders = shallowRef<IoOrder[]>([]);

const PayAmountCard = defineAsyncComponent(
  () => import("@/component/card/PayAmountCard.vue")
);
const OrderItemsTable = defineAsyncComponent(
  () => import("@/component/table/OrderItemsTable.vue")
);

const renderPopover = <T, K extends keyof T>(
  btnTxtField: K,
  render: (d: T) => ReturnType<typeof h>,
  data?: T
) =>
  data
    ? h(
        NPopover,
        { trigger: "hover" },
        {
          trigger: () =>
            h(
              NButton,
              {},
              {
                default: () => data[btnTxtField],
              }
            ),
          default: () => render(data),
        }
      )
    : "-";
const renderAmount = (amount?: PayAmount) =>
  renderPopover("amount", (d) => h(PayAmountCard, { amount: d }), amount);

const orderColumns: DataTableColumns<IoOrder> = [
  {
    type: "selection",
  },
  {
    type: "expand",
    // expandable: (rowData) => rowData.name !== "Jim Green",
    renderExpand: (rowData) => {
      return h(OrderItemsTable, {
        items: rowData.items as OrderItemCombined[],
      });
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
    render: (row) =>
      h(
        NPopover,
        { trigger: "hover" },
        {
          trigger: () =>
            h(
              NButton,
              {},
              {
                default: () => formatDate(loadDate(row.od.createdAt), "MIN"),
              }
            ),
          default: () =>
            h(
              NSpace,
              { vertical: true },
              {
                default: () => [`shop id: ${row.shopId}`],
              }
            ),
        }
      ),
  },
  {
    title: "상품지불",
    key: "prodAmount",
    render: (row) => renderAmount(row.prodAmount),
  },
  {
    title: "픽업지불",
    key: "pickAmount",
    render: (row) => renderAmount(row.pickAmount),
  },
  {
    title: "배송지불",
    key: "shipAmount",
    render: (row) => renderAmount(row.shipAmount),
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
const orderRowKey = (row: IoOrder) => row.dbId;
</script>
<template>
  <n-card title="주문 목록 페이지." style="width: 80vw">
    <n-space vertical>
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
      <n-select
        v-model:value="states"
        clearable
        placeholder="주문상태 선택"
        multiple
        :options="stateOpt"
      />
      <n-space justify="end">
        행 개수: <n-text type="info"> {{ orders.length }} </n-text>
        <n-button @click="onSearch"> 검색 </n-button>
      </n-space>
      <n-divider />
      <!-- Async expand tree data 로 비동기 로드가 가능하다. -->
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
