<script setup lang="ts">
import { ioFireStore, getIoCollectionGroup } from "@/plugin/firebase";
import {
  batchInQuery,
  formatDate,
  loadDate,
  uniqueArr,
} from "@io-boxies/js-lib";
import {
  downloadOrders,
  getUserName,
  IoOrder,
  IoUser,
  orderFireConverter,
  OrderItemCombined,
  ORDER_STATE,
  PayAmount,
  useCalenderSearch,
  userFireConverter,
  USER_DB,
} from "@/composable";
import {
  DocumentData,
  getDocs,
  Query,
  query,
  where,
} from "@firebase/firestore";
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
import { dataFromSnap, renderPopover } from "@/util";

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

const uById = ref<{ [uid: string]: IoUser }>({});
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
  const uids = uniqueArr(orders.value.map((x) => x.shopId));
  const us = await USER_DB.getUserByIds(
    ioFireStore,
    uids.filter((uid) => !uById.value[uid])
  );
  us.forEach((u) => {
    uById.value[u.userInfo.userId] = u;
  });
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
    title: "유저이름",
    key: "uname",
    render(row) {
      return uById.value[row.shopId]
        ? getUserName(uById.value[row.shopId])
        : "-";
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

async function downOrders() {
  const data = orders.value.flatMap((x) => x.items);

  const virUserC = getIoCollectionGroup(
    ioFireStore,
    "VIRTUAL_USER"
  ).withConverter(userFireConverter);
  const virUserSnap = await batchInQuery<IoUser>(
    uniqueArr(data.map((x) => x.vendorId)),
    virUserC as Query<DocumentData>,
    "userInfo.userId"
  );
  const virVendors = virUserSnap.flatMap(dataFromSnap<IoUser>);
  return downloadOrders(uById.value, data, virVendors);
}
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
      <n-space item-style="width: 100%">
        <n-select
          v-model:value="states"
          clearable
          placeholder="주문상태 선택"
          multiple
          :options="stateOpt"
        />
      </n-space>
      <n-space justify="end">
        행 개수: <n-text type="info"> {{ orders.length }} </n-text>
        <n-button @click="onSearch"> 검색 </n-button>
        <n-button @click="downOrders"> 테이블 엑셀다운 </n-button>
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
