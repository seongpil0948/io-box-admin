import { loadDate } from "@/util/date";
import { commonToJson, USER_ROLE } from "@io-boxies/js-lib";
import {
  FirestoreDataConverter,
  DocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { CsPost } from "./domain";

export function csFromJson(data: { [x: string]: any }): CsPost | null {
  return {
    createdAt: loadDate(data.createdAt),
    no: data.no,
    category: data.category,
    title: data.title,
    content: data.content,
    postType: data.postType,
    allowRole: data.allowRole as USER_ROLE,
  };
}
export const csPostFireConverter: FirestoreDataConverter<CsPost | null> = {
  toFirestore: (post: CsPost) => {
    return commonToJson(post);
  },
  fromFirestore: (
    snapshot: DocumentSnapshot<DocumentData>,
    options: any
  ): CsPost | null => {
    const data = snapshot.data(options);
    return data !== undefined ? csFromJson(data) : null;
  },
};
