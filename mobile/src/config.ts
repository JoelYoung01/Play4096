export const APP_NAME = "Play4096";
export const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5173";
export const API_BASE_URL = `${API_URL.replace(/\/$/, "")}/api/v1`;
export const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "";
export const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "";
export const PRO_PRODUCT_ID = "com.joelyoung.play4096.pro.unlock";
