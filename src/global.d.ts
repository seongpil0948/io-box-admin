import { ioFire } from "@/plugin/firebase";
import type { Router } from "vue-router";
import "pinia";
import "vue-router";
import "vue";

declare module "vue" {
  // provide typings for `this.$store`
  interface ComponentCustomProperties {
    $fire: typeof ioFire;
  }
}

declare module "pinia" {
  export interface PiniaCustomProperties {
    // // by using a setter we can allow both strings and refs
    // set hello(value: string | Ref<string>);
    // get hello(): string;
    $fire: typeof ioFire;
    $router: Router;
  }
  export interface DefineStoreOptionsBase<S, Store> {
    // allow defining a number of ms for any of the actions
    debounce?: Partial<Record<keyof StoreActions<Store>, number>>;
  }
}
