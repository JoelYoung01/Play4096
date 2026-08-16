import type { PlayStats } from "@/types";
import { get } from "./client";

export const getStats = () => get<{ stats: PlayStats }>("/stats");
