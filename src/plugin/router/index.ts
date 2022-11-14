import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import HomeView from "@/view/HomeView.vue";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "home",
    component: HomeView,
  },
  {
    path: "/login",
    name: "Login",
    component: HomeView,
  },
  {
    path: "/userList",
    name: "UserList",
    component: () =>
      import(/* webpackChunkName: "user" */ "@/view/UserList.vue"),
  },
  {
    path: "/csWrite",
    name: "CsWrite",
    component: () => import(/* webpackChunkName: "cs" */ "@/view/CsWrite.vue"),
  },
  {
    path: "/csPostList",
    name: "CsPostList",
    component: () =>
      import(/* webpackChunkName: "cs" */ "@/view/CsPostList.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
