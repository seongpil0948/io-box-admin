export * from "./common";

import { createPinia } from "pinia";
import router from "@/plugin/router";
import { ioFire } from "@/plugin/firebase";
import { markRaw } from "vue";
const pinia = createPinia();

pinia.use(({ store }) => {
  store.$router = markRaw(router);
  store.$fire = ioFire;
});

export { pinia };
