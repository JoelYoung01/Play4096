import type { ConfigContext, ExpoConfig } from "expo/config";

/** Default App Store / signing bundle id (Google iOS OAuth client is registered to this). */
const DEFAULT_BUNDLE_ID = "com.joelyoung.4096";

/**
 * Google iOS OAuth clients use a reverse-DNS URL scheme derived from the
 * client id (e.g. 123-abc.apps.googleusercontent.com → com.googleusercontent.apps.123-abc).
 */
function googleIosUrlScheme(clientId: string | undefined): string | null {
  if (!clientId) return null;
  const match = /^([\w-]+)\.apps\.googleusercontent\.com$/i.exec(clientId.trim());
  return match ? `com.googleusercontent.apps.${match[1]}` : null;
}

export default ({ config }: ConfigContext): ExpoConfig => {
  // `||` (not `??`): CI passes unset GitHub vars through as empty strings.
  const bundleIdentifier = process.env.PLAY4096_IOS_BUNDLE_ID || DEFAULT_BUNDLE_ID;
  const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "";
  const googleScheme = googleIosUrlScheme(googleIosClientId);

  return {
    ...config,
    name: "Play4096",
    slug: "play4096",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "play4096",
    userInterfaceStyle: "automatic",
    backgroundColor: "#fbf8ef",
    ios: {
      bundleIdentifier,
      buildNumber: process.env.PLAY4096_IOS_BUILD_NUMBER || "1",
      supportsTablet: false,
      usesAppleSignIn: true,
      config: {
        usesNonExemptEncryption: false
      },
      infoPlist: {
        CFBundleURLTypes: [
          { CFBundleURLSchemes: ["play4096"] },
          { CFBundleURLSchemes: [bundleIdentifier] },
          ...(googleScheme ? [{ CFBundleURLSchemes: [googleScheme] }] : [])
        ]
      }
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          backgroundColor: "#fbf8ef",
          image: "./assets/images/splash-icon.png",
          imageWidth: 120
        }
      ],
      "expo-secure-store",
      "expo-apple-authentication",
      [
        "expo-local-authentication",
        {
          faceIDPermission: "Play4096 uses Face ID to unlock the app."
        }
      ]
    ],
    experiments: {
      typedRoutes: false
    }
  };
};
