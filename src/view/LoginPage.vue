<script setup lang="ts">
// import { createUserWithEmailAndPassword, getAuth } from "@firebase/auth";
import { NSpace, useMessage } from "naive-ui";
import { LoginReturn, LoginView } from "@io-boxies/vue-lib";
import { useAuthStore } from "@/store";
import { ioFire } from "@/plugin/firebase";
const msg = useMessage();
const authS = useAuthStore();

async function onLogin(data: LoginReturn | undefined) {
  if (!data) return msg.error("아이디 혹은 비밀번호가 틀렸습니다.");
  else if (data.wrongPassword) return msg.error("비밀번호가 틀렸습니다.");
  else if (data.toSignup) return msg.error("없는유저 입니다.");
  // else if (data.toSignup) {
  //   console.log("data: ", data);
  //   if (data.params.providerId === "EMAIL") {
  //     if (!data.params.email) return msg.error("email is null");
  //     else if (!data.params.password) return msg.error("password is null");
  //     const auth = getAuth();
  //     try {
  //       const credential = await createUserWithEmailAndPassword(
  //         auth,
  //         data.params.email,
  //         data.params.password
  //       );
  //       console.log("credential: ", credential);
  //       return msg.success(
  //         `${credential.user.uid}, ${credential.user.email} 회원가입이 되었습니다.`
  //       );
  //     } catch (e: any) {
  //       if (typeof e.code === "string") {
  //         if (e.code.includes("email-already-in-use")) {
  //           return msg.error("이미 사용중인 이메일입니다.");
  //         } else {
  //           throw e;
  //         }
  //       }
  //       throw e;
  //     }
  //   }
  //   router.push({
  //     name: "SignUp",
  //     state: data.params as { [k: string]: any },
  //   });
  // }
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
</script>

<template>
  <NSpace vertical justify="center" align="center" class="page-container">
    <LoginView
      :fire-app="ioFire"
      kakao-img-other-path="icon-kakao-talk-black.png"
      kakao-img-path="/icon-kakao-talk.png"
      logo-img-path="/logo.png"
      @on-login="onLogin"
    ></LoginView>
  </NSpace>
</template>

<style>
.page-container {
  height: 90vh;
}
</style>
