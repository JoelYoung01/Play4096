import { getIapProducts, PRO_PRODUCT_ID, verifyApplePurchase } from "@/api/iap";
import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { useSessionStore } from "@/stores/session";
import { useThemeStore } from "@/stores/theme";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Alert, Platform, Text, View } from "react-native";

export default function ProScreen() {
  const user = useSessionStore((s) => s.user); const theme = useThemeStore((s) => s.theme); const { data } = useQuery({ queryKey: ["iap-products"], queryFn: getIapProducts }); const [pending, setPending] = useState(false);
  const purchase = async () => {
    if (!user) { Alert.alert("Sign in required", "Create an account before purchasing Pro."); return; }
    if (Platform.OS !== "ios") { Alert.alert("iOS only", "StoreKit purchases are available in the iOS app."); return; }
    setPending(true);
    try {
      const IAP = await import("react-native-iap"); const productId = data?.productId || PRO_PRODUCT_ID;
      await (IAP as any).initConnection?.();
      const products = await ((IAP as any).getProducts?.({ skus: [productId] }) ?? (IAP as any).getProducts?.([productId]));
      if (!products?.length) throw new Error("Pro product is not available yet.");
      const purchaseResult = await ((IAP as any).requestPurchase?.({ sku: productId }) ?? (IAP as any).requestPurchase?.(productId));
      const tx = Array.isArray(purchaseResult) ? purchaseResult[0] : purchaseResult;
      const signedTransaction = tx?.transactionJws || tx?.purchaseToken || tx?.transactionReceipt;
      if (!signedTransaction) throw new Error("StoreKit did not return a signed transaction.");
      const verified = await verifyApplePurchase(signedTransaction);
      if (verified.user) await useSessionStore.getState().setUser(verified.user);
      await (IAP as any).finishTransaction?.({ purchase: tx, isConsumable: false });
      Alert.alert("Pro unlocked", "Thanks for upgrading Play4096.");
    } catch (err) { Alert.alert("Purchase failed", err instanceof Error ? err.message : "Could not complete purchase."); }
    finally { setPending(false); }
  };
  return <Screen title="Play4096 Pro" subtitle="Unlock Pro themes, daily challenge runs, detailed stats, and full game history."><View style={{ gap: 10 }}><Text style={{ color: theme.text ?? theme.textLight, fontSize: 24, fontWeight: "900" }}>{user?.isPro ? "You are Pro" : "One-time upgrade"}</Text><Text style={{ color: theme.textLight }}>Product: {data?.productId || PRO_PRODUCT_ID}</Text><Text style={{ color: theme.textLight }}>Bundle: {data?.bundleId || "com.joelyoung.play4096.pro"}</Text></View><Button disabled={pending || user?.isPro} onPress={() => void purchase()}>{user?.isPro ? "Pro active" : pending ? "Opening StoreKit..." : "Upgrade with StoreKit"}</Button></Screen>;
}
