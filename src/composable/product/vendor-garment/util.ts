import {
  USER_DB,
  uniqueArr,
  batchInQuery,
  dataFromSnap,
  getIoCollection,
  IoCollection,
} from "@io-boxies/js-lib";
import { where, QueryConstraint } from "firebase/firestore";
import { StockCntObj } from "../shop-garment";
import { VendorUserGarmentCombined } from "./domain";
import { VendorGarment } from "./model";
import { ioFireStore } from "@/plugin/firebase";

export async function toVendorUserGarmentCombined(
  prods: VendorGarment[]
): Promise<VendorUserGarmentCombined[]> {
  const vendors = await USER_DB.getUserByIds(
    ioFireStore,
    uniqueArr(prods.map((x) => x.vendorId))
  );
  const pkgIds = prods.map((y) => y.vendorProdPkgId);
  const pkgSnaps = await batchInQuery<VendorGarment>(
    pkgIds,
    vendorProdC,
    "vendorProdPkgId"
  );
  const vendorProds = pkgSnaps.flatMap(dataFromSnap<VendorGarment>);
  const obj = vendorProds.reduce<{
    [userAndProdName: string]: VendorUserGarmentCombined;
  }>((acc, curr) => {
    const user = vendors.find((x) => x.userInfo.userId === curr.vendorId);
    if (!user) return acc;
    const userProd = Object.assign({}, curr, user);
    const similarId = VendorGarment.similarId(userProd);
    if (!acc[similarId]) {
      acc[similarId] = Object.assign({}, userProd, {
        allStockCnt: 0,
        colors: [],
        sizes: [],
        stockCnt: {} as StockCntObj,
      }) as VendorUserGarmentCombined;
    }
    if (!acc[similarId].stockCnt[userProd.size]) {
      acc[similarId].stockCnt[userProd.size] = {};
    }
    acc[similarId].stockCnt[userProd.size][userProd.color] = {
      stockCnt: userProd.stockCnt,
      prodId: userProd.vendorProdId,
    };
    if (!acc[similarId].sizes.includes(userProd.size)) {
      acc[similarId].sizes.push(userProd.size);
    }
    if (!acc[similarId].colors.includes(userProd.color)) {
      acc[similarId].colors.push(userProd.color);
    }
    acc[similarId].allStockCnt += userProd.stockCnt;
    return acc;
  }, {});
  return Object.values(obj);
}

export const vendorProdC = getIoCollection(ioFireStore, {
  c: IoCollection.VENDOR_PROD,
}).withConverter(VendorGarment.fireConverter());

export const similarConst = (vendorId: string, vendorProdName: string) =>
  [
    where("vendorId", "==", vendorId),
    where("vendorProdName", "==", vendorProdName),
  ] as QueryConstraint[];
