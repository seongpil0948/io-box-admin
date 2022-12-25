<script setup lang="ts">
// import { createUserWithEmailAndPassword, getAuth } from "@firebase/auth";
import { NSpace, useMessage } from "naive-ui";
import { LoginReturn, LoginView } from "@io-boxies/vue-lib";
import { useAuthStore } from "@/store";
import { API_URL } from "@/constants";
const msg = useMessage();
const authS = useAuthStore();

async function onLogin(data: LoginReturn | undefined) {
  if (!data) return msg.error("아이디 혹은 비밀번호가 틀렸습니다.");
  else if (data.wrongPassword) return msg.error("비밀번호가 틀렸습니다.");
  else if (data.toSignup) return msg.error("없는유저 입니다.");
  else if (!data.user) return msg.error("유저가 있어야 하는데 없습니다.(bug)");
  else if (data.noConfirm) {
    authS.logout(false);
    return msg.error("관리자가 검토중인 계정입니다.");
  } else if (data.user) {
    if (data.user.userInfo.role !== "ADMIN") {
      return msg.error("당신은.. 관리자가 아니죠?");
    }

    msg.success("로그인 성공!!!!");
    authS.login(data.user, true);
  } else {
    return msg.error("핸들링 되지 못한 에러");
  }
}
function onInternalError(err: any) {
  if (err.code === "auth/custom-token-mismatch") {
    const msgStr =
      "인증과정에서 auth/custom-token-mismatch 에러가 발생했습니다.";
    msg.error(msgStr);
  } else {
    console.log(`code: ${err.code}, message: ${err.message}`, err);
  }
}
</script>

<template>
  <NSpace vertical justify="center" align="center" class="page-container">
    <LoginView
      env="io-prod"
      :custom-token-url="`${API_URL}/auth/customToken`"
      kakao-img-other-path="icon-kakao-talk-black.png"
      kakao-img-path="/icon-kakao-talk.png"
      logo-img-path="/logo.png"
      @on-login="onLogin"
      @on-internal-error="onInternalError"
    ></LoginView>
  </NSpace>
</template>

<style>
.page-container {
  height: 90vh;
}
</style>
