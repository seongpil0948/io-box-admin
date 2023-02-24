import { getUserName, IoUser, USER_DB } from "@/composable";
import { ioFireStore } from "@/plugin/firebase";
import { uniqueArr } from "@/util/io-fns";
import { locateToStr } from "@io-boxies/js-lib";
import { OrderItem, ORDER_STATE } from "../domain";
import { utils, writeFile } from "xlsx";

export async function downloadOrders(
  shopById: { [uid: string]: IoUser },
  items: OrderItem[],
  virVendors: IoUser[]
) {
  const vendors = await USER_DB.getUserByIds(
    ioFireStore,
    uniqueArr(items.map((d) => d.vendorId))
  );

  const vendorsById = [...vendors, ...virVendors].reduce((acc, v) => {
    if (!v) return acc;
    acc[v.userInfo.userId] = v;
    return acc;
  }, {} as { [k: string]: IoUser });
  const json = items.reduce((acc, curr) => {
    const vendor = vendorsById[curr.vendorId];
    if (vendor) {
      const locate =
        vendor?.companyInfo?.shipLocate ?? vendor?.companyInfo?.locations[0];
      acc.push({
        소매처: getUserName(shopById[curr.shopId]),
        도매처: getUserName(vendor),
        "도매처 연락처": vendor.userInfo.phone,
        "도매처 회사 연락처": vendor.companyInfo?.companyPhone,
        주문개수: curr.orderCnt,
        소매상품명: curr.shopProd.prodName,
        도매상품명: curr.vendorProd.vendorProdName,
        컬러: curr.vendorProd.color,
        사이즈: curr.vendorProd.size,
        미송수량: curr.pendingCnt,
        도매가: curr.vendorProd.vendorPrice,
        합계: curr.orderCnt * curr.vendorProd.vendorPrice,
        주문상태: ORDER_STATE[curr.state],
        "도매처 건물명": locate?.alias ?? "",
        "도매처 상세주소": locate?.detailLocate ?? "",
        "도매처 주소": locate ? locateToStr(locate) : "",
        "주소 연락처": locate?.phone,
      });
    }
    return acc;
  }, [] as any[]);
  const date = new Date();
  const fileName = `order_${date.toLocaleString()}.xlsx`;
  const worksheet = utils.json_to_sheet(json);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "Dates");
  writeFile(workbook, fileName);
}
