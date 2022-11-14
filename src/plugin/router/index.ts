import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import HomeView from "@/view/HomeView.vue";
import { useAuthStore } from "@/store";
import LayoutView from "@/view/LayoutView.vue";
const routes: Array<RouteRecordRaw> = [
  {
    path: "/app",
    component: LayoutView,
    children: [
      {
        path: "/",
        name: "home",
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
        component: () =>
          import(/* webpackChunkName: "cs" */ "@/view/CsWrite.vue"),
      },
      {
        path: "/csPostList",
        name: "CsPostList",
        component: () =>
          import(/* webpackChunkName: "cs" */ "@/view/CsPostList.vue"),
      },
    ],
  },

  {
    path: "/login",
    name: "Login",
    component: () =>
      import(/* webpackChunkName: "user" */ "@/view/LoginPage.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

router.beforeEach(async (to) => {
  const authStore = useAuthStore();
  const u = authStore.currUser;
  function goLogin() {
    if (to.name !== "Login") {
      return { name: "Login" };
    }
  }

  if (!u) goLogin();
  else if (u.userInfo.role !== "ADMIN") {
    authStore.logout(false);
    goLogin();
  }
});

export default router;
