import { useMessage } from "naive-ui";
import {
  IoAccount,
  IO_PAY_DB,
  ReqEncash,
  reqEncashConverter,
} from "@/composable";
import { catchError } from "@/util";
import { doc, updateDoc } from "@firebase/firestore";
// import axios from "@/plugin/axios";
import { getIoCollection, ioFireStore } from "@/plugin/firebase";

export function useEncash() {
  const msg = useMessage();
  const c = getIoCollection(ioFireStore, { c: "REQUEST_ENCASH" }).withConverter(
    reqEncashConverter
  );
  async function rejectEncash(row: ReqEncash) {
    await updateDoc(doc(c, row.dbId), {
      rejectedAt: new Date(),
      isDone: true,
      adminMemo: row.adminMemo ?? "",
      result: "rejected",
    });
    msg.success("반려 완료");
  }
  async function approveEncash(row: ReqEncash, account: IoAccount) {
    console.log("account: ", account);
    if (row.approvedAt || row.isDone)
      return msg.error("이미 완료된 건 입니다.");
    const pay = await IO_PAY_DB.getIoPayByUser(row.userId);
    if (pay.budget < row.amount)
      return msg.error("유저 보유금액이 요청 금액보다 작습니다.");

    return pay
      .updatePay("WITH_DRAW", -row.amount, 0)
      .then(async () => {
        const receipt: any = {
          approvedAt: new Date(),
          isDone: true,
          result: "approve",
        };
        if (row.adminMemo) {
          receipt["adminMemo"] = row.adminMemo;
        }
        await updateDoc(doc(c, row.dbId), receipt);
        msg.success("성공");
        // const formData = new FormData();
        // formData.set("amount", String(row.amount));
        // formData.set("bankCode", account!.code);
        // formData.set("accountNo", account!.accountNumber);
        // formData.set("accountName", account!.accountName);
        // axios
        //   .post("/api/payagent/remitAccount", formData)
        //   .then(() => {
        //     msg.success("프로세스 전체 성공");
        //   })
        //   .catch((err) =>
        //     catchError({
        //       err,
        //       msg,
        //       prefix:
        //         "유저 코인은 차감 되었지만, 송금 과정에서 문제가 발생했습니다.",
        //     })
        //   );
      })
      .catch((err) =>
        catchError({ err, msg, prefix: "유저 보유금액(코인) 차감 실패" })
      );
  }
  return { msg, approveEncash, rejectEncash, c };
}
