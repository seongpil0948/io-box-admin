<script setup lang="ts">
import {
  CsPost,
  csPostFireConverter,
  FAQ_CATEGORIES,
  POST_TYPE,
} from "@/composable";
import { postTypeOpt } from "@/composable/cs/constant";
import { computed, ref, toRefs, watch } from "vue";
import { useEditor } from "@/plugin/editor";
import { doc, setDoc } from "@firebase/firestore";
import { uuidv4 } from "@firebase/util";
import { NButton, NCard, NInput, NSelect, NSpace, useMessage } from "naive-ui";
import { useRouter } from "vue-router";
import { getIoCollection, USER_ROLE } from "@io-boxies/js-lib";
import { ioFireStore } from "@/plugin/firebase";
const props = defineProps<{
  post?: CsPost;
}>();
const { post } = toRefs(props);
const emits = defineEmits<{
  (e: "posted"): void;
}>();

const { saveEditor } = useEditor({
  readOnly: false,
  elementId: "io-editor",
  placeholder: "상품 정보 입력",
  data: post?.value && post.value?.content ? post.value.content : undefined,
});
const msg = useMessage();
const router = useRouter();
const postModel = ref<{ [k: string]: any | null }>({
  title: post?.value ? post?.value.title : null,
  category: post?.value ? post?.value.category : null,
  allowRole: post?.value ? post?.value.allowRole : null,
  postType: post?.value ? post?.value.postType : null,
});
watch(
  () => postModel.value.allowRole,
  () => {
    postModel.value.category = null;
  }
);
const roleOpt = Object.values(USER_ROLE).map((x) => {
  return {
    label: x,
    value: x,
  };
});
const ctgrOpt = computed(
  () => FAQ_CATEGORIES[postModel.value.allowRole ?? ""] ?? []
);

async function onPostSubmit() {
  const v = postModel.value;
  const info = await saveEditor();
  if (!info) return msg.error(`내용이 누락되었슴다`);
  for (let i = 0; i < Object.keys(v).length; i++) {
    const key = Object.keys(v)[i];
    if (!v[key]) {
      return msg.error(`${key}가 누락되었슴다`);
    }
  }
  const data: CsPost = {
    createdAt: post?.value ? post?.value.createdAt : new Date(),
    no: post?.value ? post?.value.no : uuidv4(),
    category: v.category!,
    title: v.title!,
    content: info!,
    postType: v.postType! as POST_TYPE,
    allowRole: v.allowRole as USER_ROLE,
  };
  const docRef = doc(
    getIoCollection(ioFireStore, { c: "CS_POST" }).withConverter(
      csPostFireConverter
    ),
    data.no
  );
  await setDoc(docRef, data);
  msg.success("성공!");
  emits("posted");
  router.replace({ name: "CsPostList" });
}
</script>
<template>
  <n-space vertical align="center" item-style="width: 100%; height: 100%">
    <n-input v-model:value="postModel.title" placeholder="제목" />
    <n-space item-style="min-width: 200px;">
      <n-select
        v-model:value="postModel.postType"
        placeholder="포스팅타입"
        :options="postTypeOpt"
      />
      <n-select
        v-model:value="postModel.allowRole"
        placeholder="허용유저타입"
        :options="roleOpt"
      />
      <n-select
        v-model:value="postModel.category"
        placeholder="카테고리"
        :options="ctgrOpt"
      />
    </n-space>
    <n-card>
      <div id="io-editor"></div>
    </n-card>
    <n-button @click="onPostSubmit"> 제출 </n-button>
  </n-space>
</template>
