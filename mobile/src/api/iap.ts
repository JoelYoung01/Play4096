import { PRO_PRODUCT_ID } from "@/config";
import type { User } from "@/types";
import { get, post } from "./client";

export const getIapProducts = () => get<{ productId: string; bundleId: string; isPro: boolean }>("/iap/products");
export const verifyApplePurchase = (signedTransaction: string) =>
  post<{ success: boolean; alreadyProcessed?: boolean; transactionId?: string; user?: User | null }>("/iap/apple/verify", { signedTransaction });
export { PRO_PRODUCT_ID };
