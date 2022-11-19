import { csPostFireConverter } from "@/composable";
import { onBeforeMount, ref } from "vue";
import { CsPost } from "./domain";
import { deleteDoc, doc, getDocs, orderBy, query } from "firebase/firestore";
import { getIoCollection } from "@io-boxies/js-lib";
export function useCsList() {
  const postCollection = getIoCollection({ c: "CS_POST" }).withConverter(
    csPostFireConverter
  );
  const posts = ref<CsPost[]>([]);
  onBeforeMount(async () => {
    await getPosts();
  });

  async function getPosts() {
    posts.value = [];
    const docs = await getDocs(
      query(postCollection, orderBy("createdAt", "desc"))
    );
    docs.docs.forEach((d) => {
      const data = d.data();
      if (data) {
        posts.value.push(data);
      }
    });
  }

  async function deletePost(postId: string) {
    return await deleteDoc(doc(postCollection, postId));
  }

  return {
    posts,
    getPosts,
    deletePost,
  };
}
