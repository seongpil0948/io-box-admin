import { onMounted } from "vue";
import { ref, onBeforeUnmount } from "vue";
import EditorJS, { API } from "@editorjs/editorjs";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Header from "@editorjs/header";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import List from "@editorjs/list";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Table from "@editorjs/table";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Embed from "@editorjs/embed";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import ImageTool from "@editorjs/image";
import {
  getDownloadURL,
  getStorage,
  ref as storageRef,
  uploadBytes,
} from "firebase/storage";
import { IoFireApp } from "@io-boxies/js-lib";
import { uuidv4 } from "@firebase/util";
export interface IoEditorParam {
  readOnly: boolean;
  elementId: string;
  onChange?: (api: API, event: CustomEvent<any>) => void;
  placeholder: string;
  data?: any;
}

export function useEditor(c: IoEditorParam) {
  const editor = ref<EditorJS | null>(null);

  onMounted(() => {
    editor.value = getEditor(c);
  });
  onBeforeUnmount(() => {
    if (editor.value) {
      editor.value.clear();
      editor.value.destroy();
      // editor.value.off();
    }
  });
  function clearEditor() {
    if (editor.value) {
      editor.value.clear();
    }
  }
  async function saveEditor() {
    try {
      if (editor.value) {
        const info = await editor.value.save();
        return info.blocks.length > 0 ? info : undefined;
      }
    } catch (error) {
      console.error(null, "fail to saving editorJs, error:", error);
    }
  }

  return { editor, saveEditor, clearEditor, getEditor };
}

export function getEditor(c: IoEditorParam) {
  const _editor = new EditorJS({
    data:
      c.data && c.data.blocks && c.data.blocks.length > 0 ? c.data : undefined,
    readOnly: c.readOnly,
    holder: c.elementId,
    placeholder: c.placeholder,
    onChange: c.onChange,
    tools: {
      list: List,
      table: Table,
      header: Header,
      embed: {
        class: Embed,
        inlineToolbar: true,
      },
      image: {
        class: ImageTool,
        config: {
          field: "spField",
          additionalRequestData: {
            reqSpData: "hihi",
          },
          additionalRequestHeaders: {
            authorization: "Bearer eyJhbGciJ9...TJVA95OrM7h7HgQ",
          },
          captionPlaceholder: "이미지 설명글을 입력해주세요.",
          buttonContent: "Image Upload",
          uploader: {
            async uploadByFile(
              file: File
            ): Promise<{ success: number; file: { url: string } }> {
              console.log("uploadFile: ", file);
              const storage = getStorage(IoFireApp.getInst().app);
              const noticeRef = storageRef(
                storage,
                `cs/notice/${uuidv4()}_${file.name}`
              );
              return uploadBytes(noticeRef, file).then((snapshot) => {
                return getDownloadURL(snapshot.ref).then((downloadURL) => {
                  return {
                    success: 1,
                    file: {
                      url: downloadURL,
                      // any other image data you want to store, such as width, height, color, extension, etc
                    },
                  };
                });
              });
            },
            // endpoints: {
            //   byFile: "http://localhost:8008/uploadFile", // Your backend file uploader endpoint
            //   byUrl: "http://localhost:8008/fetchUrl", // Your endpoint that provides uploading by Url
            // },
          },
        },
      },
    },
  });
  return _editor;
}
