import { getAmount } from "@/composable";
import { IoUser } from "@io-boxies/js-lib";
import { IoOrder, OrderItem, OrderItemCombined, PayAmount } from "../domain";

export function isValidOrder(o: IoOrder): void {
  if (o.pendingCnts + o.activeCnts !== o.orderCnts) {
    throw new Error("invalid count");
  } else if (!isValidAmount(o.prodAmount)) {
    throw new Error("invalid amount");
  }
  o.items.forEach((item) => isValidOrderItem(item));
}
export function isValidOrderItem(o: OrderItem | OrderItemCombined): void {
  const counts: { [k: string]: number } = {};
  for (let i = 0; i < o.orderIds.length; i++)
    counts[o.orderIds[i]] = counts[o.orderIds[i]] + 1 || 1;
  if (Object.values(counts).some((cnt) => cnt > 1)) {
    throw new Error("redundant order id ");
  } else if (o.pendingCnt + o.activeCnt !== o.orderCnt) {
    throw new Error("invalid count");
  } else if (!isValidAmount(o.prodAmount)) {
    throw new Error("invalid amount");
  } else if (o.pendingCnt > 0 && o.vendorProd && !o.vendorProd.allowPending) {
    throw new Error("invalid allowPending");
  }
  // else if (!o.orderDbId)
  //   throw new Error(`order item(${o.id}) orderDbId is null`);
}

export function isValidAmount(a: PayAmount) {
  let isValid = true;
  if (a.amount < 0 || a.amount < a.pureAmount) {
    isValid = false;
  } else if (a.amount !== getAmount(a)) {
    isValid = false;
  }

  return isValid;
}

export function validateUser(
  u: IoUser | null | undefined,
  userId: string
): IoUser {
  if (!u) throw new Error(`유저정보가 없습니다. id: ${userId}`);
  const role = u.userInfo.role;
  const name =
    role === "SHOP"
      ? "소매처"
      : role === "VENDOR"
      ? "도매처"
      : role === "UNCLE"
      ? "배송처"
      : "유저";
  if (!u.companyInfo) throw new Error(`${name}의 회사정보가 없습니다.`);
  else if ((role === "SHOP" || role === "VENDOR") && !u.companyInfo.shipLocate)
    throw new Error(`${name}의 대표 배송지 설정을 해주세요.`);
  else if (role === "UNCLE" && !u.uncleInfo)
    throw new Error("엉클 배송지와 요금 설정을 해주세요");
  return u!;
}
