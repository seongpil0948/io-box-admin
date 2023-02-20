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
        component: () => import("@/view/UserList.vue"),
      },
      {
        path: "/csWrite",
        name: "CsWrite",
        component: () => import("@/view/CsWrite.vue"),
      },
      {
        path: "/csPostList",
        name: "CsPostList",
        component: () => import("@/view/CsPostList.vue"),
      },
      {
        path: "/pickupLocateManage",
        name: "PickupLocateManage",
        component: () => import("@/view/PickLocateManage.vue"),
      },
      {
        path: "/order/list",
        name: "OrderList",
        component: () => import("@/view/order/OrderList.vue"),
      },
      {
        path: "/ship/list",
        name: "ShipmentList",
        component: () => import("@/view/ship/ShipmentList.vue"),
      },
      {
        path: "/order/confirmPayment",
        name: "OrderConfirmPayment",
        component: () => import("@/view/order/OrderConfirmPayment.vue"),
      },
    ],
  },

  {
    path: "/login",
    name: "Login",
    component: () => import("@/view/LoginPage.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
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
