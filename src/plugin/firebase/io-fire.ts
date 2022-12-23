import {
  setPersistence,
  initializeAuth,
  browserSessionPersistence,
} from "firebase/auth";
import { IoFireApp } from "@io-boxies/js-lib";

export const ioFire = IoFireApp.getInst(
  // process.env.NODE_ENV === "production" ? "io-prod" : "io-dev"
  "io-prod"
);

export async function initIoFirebase() {
  const ioFire = IoFireApp.getInst(
    // process.env.NODE_ENV === "production" ? "io-prod" : "io-dev"
    "io-prod"
  );
  const auth = initializeAuth(ioFire.app);
  await setPersistence(auth, browserSessionPersistence);
}

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
