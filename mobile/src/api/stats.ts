import { get } from "./client";

export const getStats = () => get<{ stats: Record<string, unknown> }>("/stats");
