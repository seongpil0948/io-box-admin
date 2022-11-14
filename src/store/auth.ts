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
        const u = IoUser.fromJson(JSON.parse(userStr));
        if (!u) {
          router.replace({ name: "Login" });
        }
        user.value = u!;
        return user.value;
      } else {
        router.replace({ name: "Login" });
        return user.value;
      }
    } else {
      return user.value;
    }
  });

  function setUser(u: IoUser) {
    localStorage.setItem(userKey, JSON.stringify(u));
    user.value = u;
  }
  function login(u: IoUser) {
    if (user.value) {
      if (user.value.userInfo.userId === u.userInfo.userId) return;
      else clearUser();
    }
    setUser(u);
  }
  function clearUser() {
    localStorage.clear();
    user.value = null;
  }

  async function logout(replace = true) {
    clearUser();
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
