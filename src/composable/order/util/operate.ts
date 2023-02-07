import { PAID_INFO } from "@/composable/common";
import { uniqueArr } from "@io-boxies/js-lib";
import { refreshOrder } from ".";
import { IoOrder, OrderItem, OrderItemCombined, ORDER_STATE } from "../domain";
import {
  getPendingCnt,
  getActiveCnt,
  getPureAmount,
  getOrderAmount,
  getOrderItems,
} from "./getter";
import { isValidOrderItem, isValidOrder } from "./validate";

export function setOrderCnt(d: {
  order: IoOrder;
  orderItemId: string;
  orderCnt: number;
  add?: boolean;
  paid?: PAID_INFO;
  orderId?: string;
}) {
  // add = true,
  //   paid = PAID_INFO.NO,
  // 0. find prod order
  const targetIdx = d.order.items.findIndex((x) => x.id === d.orderItemId);
  if (targetIdx < 0) throw new Error("orderItem not belong to order");
  const item: OrderItemCombined = (d.order.items as OrderItemCombined[])[
    targetIdx
  ];
  const v = item.vendorProd;
  setItemCnt(item, d.orderCnt, v.stockCnt, v.allowPending, d.add, d.paid);
  if (d.orderId) item.orderIds.push(d.orderId);
  refreshOrder(d.order);
  isValidOrder(d.order);
}
export function setItemCnt(
  item: OrderItem,
  orderCnt: number,
  stockCnt: number,
  allowPending: boolean,
  add = true,
  paid = PAID_INFO.NO
) {
  if (add) {
    orderCnt += item.orderCnt;
  }
  item.orderCnt = orderCnt;
  // 2. set pending cnt
  item.pendingCnt = getPendingCnt(stockCnt, orderCnt, allowPending);
  // 3. set active cnt
  item.activeCnt = getActiveCnt(orderCnt, item.pendingCnt);
  // 4. set prod order amount
  const pureAmount = getPureAmount(orderCnt, item.vendorProd.vendorPrice);
  item.amount.paid = paid;
  item.amount.pureAmount = pureAmount;
  item.amount.orderAmount = getOrderAmount(item.amount);
  try {
    isValidOrderItem(item);
  } catch (e) {
    throw new Error(
      `Invalid Prod Order: ${item.id} orderDbId: ${item.orderDbId}, error: ${e}`
    );
  }
}

export function setState(order: IoOrder, itemId: string, state: ORDER_STATE) {
  const ts = getOrderItems({ order, itemId });
  if (ts && ts.length > 0) {
    ts[0].beforeState = ts[0].state;
    ts[0].state = state;
    order.states = uniqueArr(order.items.map((x) => x.state));
  } else {
    throw new Error(`order item id ${itemId} not exist`);
  }
}
