import { IoUser } from "@/composable";
import router from "@/plugin/router";
import { getAuth, signOut } from "@firebase/auth";
import { defineStore } from "pinia";
import { ref, computed } from "vue";

const userKey = "user";
export const useAuthStore = defineStore("auth", () => {
  console.log(`=== called useAuthStore === `);
  // const user = ref<null | any>();
  const user = ref<null | any>();
  const auth = getAuth();

  const currUser = computed(() => {
    if (!user.value) {
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

  // onAuthStateChanged(auth, (user) => {
  //   console.log("onAuthStateChanged: ", user);
  // });

  function setUser(u: any) {
    localStorage.setItem(userKey, JSON.stringify(u));
    user.value = u;
  }
  function login(u: any, goHome: boolean) {
    if (user.value) {
      if (user.value.userInfo.userId === u.userInfo.userId) return;
      else clearUser();
    }
    setUser(u);
    if (goHome) {
      router.push({ name: "home" });
    }
  }
  function clearUser() {
    localStorage.clear();
    user.value = null;
  }

  async function logout(replace = true) {
    clearUser();
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
