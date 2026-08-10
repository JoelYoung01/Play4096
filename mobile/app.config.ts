import type { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
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
    bundleIdentifier: process.env.PLAY4096_IOS_BUNDLE_ID || "com.joelyoung.play4096",
    buildNumber: process.env.PLAY4096_IOS_BUILD_NUMBER || "1",
    supportsTablet: false,
    usesAppleSignIn: true,
    config: {
      usesNonExemptEncryption: false
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
});
