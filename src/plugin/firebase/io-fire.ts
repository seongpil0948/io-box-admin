import {
  setPersistence,
  initializeAuth,
  browserSessionPersistence,
  useDeviceLanguage,
} from "firebase/auth";
import { IoFireApp } from "@io-boxies/js-lib";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

export const ioFire = IoFireApp.getInst(
  process.env.NODE_ENV === "production" ? "io-prod" : "io-dev"
);

export async function initIoFirebase() {
  const ioFire = IoFireApp.getInst(
    process.env.NODE_ENV === "production" ? "io-prod" : "io-dev"
  );
  const auth = initializeAuth(ioFire.app);
  useDeviceLanguage(auth);
  await setPersistence(auth, browserSessionPersistence);
}
export const ioFireStorage = getStorage(ioFire.app);

export const ioFireStore = getFirestore(ioFire.app);

// export const fbApp = initializeApp(firebaseConfig);
// export const analytics = getAnalytics(fbApp);
// export const iostore = getFirestore(fbApp);
// export const getIoStorage = () => getStorage(fbApp);
// export const ioStorage = getIoStorage();

// const ioFire: IoFire = {
//   store: iostore,
//   storage: ioStorage,
//   analytics,
// };

// export { ioFire, IoFire };

export const deletedPath = (path: string) => `archive/deleted/${path}`;
