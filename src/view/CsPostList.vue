<script setup lang="ts">
import { CsPost, POST_TYPE, useCsList, USER_ROLE } from "@/composable";
import { formatDate, loadDate } from "@io-boxies/js-lib";
import {
  NText,
  NSpace,
  NH2,
  NDataTable,
  NButton,
  NDropdown,
  DropdownOption,
  NCard,
  NModal,
} from "naive-ui";
import { TableColumns } from "naive-ui/es/data-table/src/interface";
import { h, ref } from "vue";

const { posts, deletePost, getPosts } = useCsList();
const columns: TableColumns<CsPost> = [
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
    title: "제목",
    key: "title",
  },
  {
    title: "CS 타입",
    key: "postType",
    filterOptions: [
      {
        label: "FAQ",
        value: "FAQ" as POST_TYPE,
      },
      {
        label: "공지사항",
        value: "NOTICE" as POST_TYPE,
      },
      {
        label: "이벤트",
        value: "EVENT" as POST_TYPE,
      },
    ],
    filter: (value, row) => POST_TYPE[row.postType] === value,
    sorter: "default",
  },
  {
    title: "카테고리",
    key: "category",
    sorter: "default",
  },
  {
    title: "허용권한",
    key: "allowRole",
    sorter: "default",
    filterOptions: [
      {
        label: "쇼핑몰",
        value: "SHOP" as USER_ROLE,
      },
      {
        label: "도매",
        value: "VENDOR" as USER_ROLE,
      },
      {
        label: "엉클",
        value: "UNCLE" as USER_ROLE,
      },
    ],
    filter: (value, row) => USER_ROLE[row.allowRole] === value,
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
              label: "편집",
              key: "edit",
            },
            {
              label: "삭제",
              key: "delete",
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
];
const editTarget = ref<CsPost | null>(null);
function onUpdateModal(val: boolean) {
  if (!val) {
    editTarget.value = null;
  }
}
async function handlePostSelect(
  row: CsPost,
  key: string | number,
  option: DropdownOption
) {
  if (option.key === "delete") {
    await deletePost(row.no);
    posts.value.splice(
      posts.value.findIndex((x) => x.no === row.no),
      1
    );
  } else if (option.key === "edit") {
    editTarget.value = row;
  } else {
    console.info(String(key));
  }
}
async function onPosted() {
  editTarget.value = null;
  await getPosts();
}
</script>
<template>
  <n-space vertical align="center" item-style="width: 100%; height: 100%">
    <n-h2>CS 작성 페이지</n-h2>
    <n-data-table
      ref="table"
      :columns="columns"
      :data="posts"
      :pagination="{
        showSizePicker: true,
        pageSizes: [5, 10, 25, 50],
      }"
    />
  </n-space>
  <n-modal
    :show="editTarget !== null"
    :on-update:show="onUpdateModal"
    close-on-esc
    style="margin: 0 10%"
  >
    <n-card title="수정" size="large">
      <cs-post-form :post="editTarget" @posted="onPosted" />
    </n-card>
  </n-modal>
</template>
