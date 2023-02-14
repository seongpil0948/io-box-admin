<script setup lang="ts">
import { IoShipment, Locate, useCalenderSearch } from "@/composable";
import { ioFireStore, getIoCollectionGroup } from "@/plugin/firebase";
import { query, getDocs } from "@firebase/firestore";
import { formatDate, loadDate } from "@io-boxies/js-lib";
import {
  DataTableColumns,
  NPopover,
  NButton,
  NSpace,
  NCard,
  NDataTable,
  NDatePicker,
  NDivider,
  NText,
} from "naive-ui";
import { h, shallowRef, defineAsyncComponent } from "vue";
const LocateCard = defineAsyncComponent(
  () => import("@/component/card/LocateCard.vue")
);
const {
  valueFormat,
  createdRange,
  onChange,
  onClear,
  onConfirm,
  onBlur,
  getConstraints,
} = useCalenderSearch();
const rowKey = (row: IoShipment) => row.shippingId;
const renderLocate = (l: any) =>
  h(
    NPopover,
    { trigger: "hover" },
    {
      trigger: () =>
        h(
          NButton,
          {},
          {
            default: () => l.alias,
          }
        ),
      default: () => h(LocateCard, { locate: l }),
    }
  );
const orderColumns: DataTableColumns<IoShipment> = [
  {
    title: "제원",
    key: "composite",
    render: (row) => {
      let str = "";
      if (row.weightUnit)
        str += `${row.weightUnit}(${row.amountByWeight ?? ""})`;
      if (row.sizeUnit) str += `${row.sizeUnit}(${row.amountBySize ?? ""})`;
      return str;
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
                default: () => formatDate(loadDate(row.createdAt), "MIN"),
              }
            ),
          default: () =>
            h(
              NSpace,
              { vertical: true },
              {
                default: () => [`shop id: ${row.shippingId}`],
              }
            ),
        }
      ),
  },
  {
    title: "출발지",
    key: "startAddress",
    render: (row) => renderLocate(row.startAddress),
  },
  {
    title: "도착지",
    key: "receiveAddress",
    render: (row) => renderLocate(row.receiveAddress),
  },
  {
    title: "반품시주소",
    key: "returnAddress",
    render: (row) => renderLocate(row.returnAddress),
  },
];
const data = shallowRef<IoShipment[]>([]);
async function onSearch() {
  const constraints = getConstraints();
  console.log("constraints: ", constraints);
  const shipQ = query(
    getIoCollectionGroup(ioFireStore, "SHIPMENT").withConverter(
      IoShipment.fireConverter()
    ),
    ...constraints
  );
  const snap = await getDocs(shipQ);
  // dataFromSnap<IoOrder>(snap)
  data.value = snap.docs.map((x) => x.data()).filter((x) => x);
  console.log("result: ", data.value);
}
</script>
<template>
  <n-card title="배송건 목록">
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

      <n-space justify="end">
        행 개수: <n-text type="info"> {{ data.length }} </n-text>
        <n-button @click="onSearch"> 검색 </n-button>
      </n-space>
      <n-divider />
      <!-- Async expand tree data 로 비동기 로드가 가능하다. -->
      <n-data-table
        :row-key="rowKey"
        :columns="orderColumns"
        :data="data"
        :pagination="{
          showSizePicker: true,
          pageSizes: [5, 10, 25, 50, 100],
        }"
      />
    </n-space>
  </n-card>
</template>
