import { IoUser } from "@/composable";
import router from "@/plugin/router";
import { getAuth, signOut } from "firebase/auth";
import { defineStore } from "pinia";
import { ref, computed } from "vue";

const userKey = "user";
export const useAuthStore = defineStore("auth", () => {
  console.log(`=== called useAuthStore === `);
  const user = ref<null | IoUser>();

  const currUser = computed(() => {
    if (user.value === null) {
      const userStr = localStorage.getItem(userKey);
      if (userStr) {
        const u = JSON.parse(userStr);
        user.value = u!;
        return user.value;
      } else {
        router.replace({ name: "Login" });
        return null;
      }
    } else {
      return user.value;
    }
  });

  function setUser(u: IoUser) {
    localStorage.setItem(userKey, JSON.stringify(u));
    user.value = u;
  }
  async function login(u: IoUser) {
    if (user.value) {
      if (user.value.userInfo.userId === u.userInfo.userId) return;
      else await logout(false);
    }
    setUser(u);
  }

  async function logout(replace = true) {
    localStorage.clear();
    user.value = null;
    const auth = getAuth();
    await signOut(auth);
    if (replace) router.replace({ name: "Login" }); //   this.$http.get("https://www.naver.com");
  }

  return {
    currUser,
    setUser,
    login,
    logout,
  };
});
