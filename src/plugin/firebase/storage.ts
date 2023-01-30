import { listAll, deleteObject, StorageReference } from "firebase/storage";

export async function deleteFolder(pathRef: StorageReference) {
  const dir = await listAll(pathRef);
  dir.prefixes.forEach((folderRef) => {
    // All the prefixes under listRef. You may call listAll() recursively on them.
    deleteFolder(folderRef);
  });
  dir.items.forEach((fileRef) => {
    deleteObject(fileRef);
    console.log("delete file: ", fileRef);
  });
}
