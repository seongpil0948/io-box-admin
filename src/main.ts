import { createApp } from "vue";
import App from "./App.vue";
import router from "./plugin/router";
import { pinia } from "./store";
import { ioFire } from "./plugin/firebase";

const app = createApp(App);
app.use(pinia);
app.use(router);
app.config.globalProperties.$fire = ioFire;
app.mount("#app");
