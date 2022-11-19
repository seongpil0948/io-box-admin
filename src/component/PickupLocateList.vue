<script setup lang="ts">
import { Locate, LocateCRT } from "@/composable";
import { ref } from "vue";
import { onSnapshot, setDoc, doc, deleteDoc } from "@firebase/firestore";
import { useMessage } from "naive-ui";
import { getIoCollection } from "@io-boxies/js-lib";

const locates = ref<Locate[]>([]);
const msg = useMessage();
const locateCollection = getIoCollection({ c: "PICKUP_LOCATES" }).withConverter(
  Locate.fireConverter()
);
onSnapshot(locateCollection, (snapshot) => {
  locates.value = [];
  snapshot.forEach((s) => {
    const data = s.data();
    if (data) {
      locates.value.push(data);
    }
  });
});

const showAppendModal = ref(false);
async function onAppendLocate(l: Locate) {
  return setDoc(doc(locateCollection, `${l.code}__${l.alias}`), l)
    .then(() => msg.success("픽업지역 추가완료"))
    .catch(() => msg.error("픽업지역 추가실패"));
}

function onLocateClose(l: Locate) {
  deleteDoc(doc(locateCollection, `${l.code}__${l.alias}`))
    .then(() => msg.success("픽업지역 삭제완료"))
    .catch(() => msg.error("픽업지역 삭제실패"));
}

const locateKey = [
  ["도시", "city"],
  ["우편번호", "postalCode"],
  ["상세주소", "detailLocate"],
  ["성", "firstName"],
  ["이름", "lastName"],
  ["핸드폰번호", "phone"],
] as [i: string, j: keyof LocateCRT][];
</script>

<template>
  <n-space>
    <n-tooltip trigger="hover" v-for="(i, idx) in locates" :key="idx">
      <template #trigger>
        <n-tag round closable @close="onLocateClose(i as Locate)">
          {{ i.alias }}</n-tag
        >
      </template>
      <!-- keyword:  {{ locateStr(i) }} -->
      <n-card style="width: 25vw" title="주소지 정보">
        <n-space v-for="(j, idx2) in locateKey" :key="idx2 + '2'">
          <n-text type="info">{{ j[0] }} </n-text>
          <n-text type="primary">{{ i[j[1]] }} </n-text>
        </n-space>
      </n-card>
    </n-tooltip>
    <div style="width: 5px"></div>
    <n-button size="small" @click="showAppendModal = true">추가 </n-button>
  </n-space>
  <locate-append-modal
    @appendLocate="onAppendLocate"
    v-model:showAppendModal="showAppendModal"
  />
</template>
