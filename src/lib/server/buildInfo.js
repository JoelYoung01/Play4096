import { BUILD_VERSION } from "$env/static/private";

/** Git commit SHA baked in at build time, or "development" for local builds. */
export const buildVersion = BUILD_VERSION;
