import {
  PRODUCT_SIZE,
  IoOrder,
  GENDER,
  PART,
  VendorProdCrt,
  PayAmount,
  OrderItem,
} from "@/composable";
import { IoUser } from "@io-boxies/js-lib";
import { StockCntObj } from "../shop-garment";

export interface VendorGarmentCrt extends VendorProdCrt {
  gender: GENDER;
  part: PART;
  ctgr: string;
  color: string;
  allowPending: boolean;
  size: PRODUCT_SIZE;
  fabric: string;
}

export interface VendorGarmentCombined
  extends Omit<
    VendorGarmentCrt,
    "color" | "size" | "stockCnt" | "vendorProdId"
  > {
  colors: string[];
  sizes: PRODUCT_SIZE[];
  allStockCnt: number;
  stockCnt: StockCntObj;
}
export interface VendorUserGarment extends IoUser, VendorGarmentCrt {}
export interface VendorUserGarmentCombined
  extends IoUser,
    VendorGarmentCombined {}
export interface VendorOrderGarment extends VendorGarmentCrt, IoOrder {}
export interface VendorUserOrderGarment
  extends VendorUserGarment,
    Partial<PayAmount>,
    Omit<Partial<OrderItem>, "prodType" | "vendorId"> {
  shopUser?: IoUser;
}
export interface VendorProdSimilar {
  vendorId: string;
  vendorProdName: string;
}
export interface VendorProdSame extends VendorProdSimilar {
  color: string;
  size: string;
}
