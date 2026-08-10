import type { User } from "@/types";
import { del, get, patch } from "./client";

export const getAccount = () => get<{ user: User }>("/account");
export const updateAccount = (body: { displayName?: string; email?: string }) => patch<{ user: User }>("/account", body);
export const deleteAccount = () => del<{ success: boolean }>("/account");
