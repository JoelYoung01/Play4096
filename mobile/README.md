# Play4096 Mobile

Expo SDK 57 / React Native iOS app for Play4096. The native project is generated with `expo prebuild`; do not commit `ios/` or `android/`.

## Local development

```sh
cd mobile
pnpm install
EXPO_PUBLIC_API_URL=http://localhost:5173 pnpm start
```

The backend REST API is the SvelteKit server on the same host under `/api/v1/*`. Point `EXPO_PUBLIC_API_URL` at the server origin, not the `/api/v1` path. For an iOS simulator talking to a backend on the same Mac, `http://localhost:5173` works; for a physical device, use your LAN URL.

Useful commands:

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm prebuild:ios
pnpm ios
```

## Environment variables

Runtime JS config:

- `EXPO_PUBLIC_API_URL` - backend origin, defaults to `http://localhost:5173`.
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` - Google OAuth iOS client id.
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` - Google OAuth web client id for development/web.

Native/iOS build config:

- `PLAY4096_IOS_BUNDLE_ID` - defaults to `com.joelyoung.play4096`.
- `PLAY4096_IOS_BUILD_NUMBER` - defaults to `1`.
- `APPLE_TEAM_ID` - Apple Developer team id used by local/CI signing.

App Store Connect / StoreKit CI secrets (same as Sous Kit / Jamez):

- `ASC_KEY_ID`
- `ASC_ISSUER_ID`
- `ASC_PRIVATE_KEY`
- `APPLE_TEAM_ID`

Optional GitHub variables: `PLAY4096_IOS_BUNDLE_ID`, `MOBILE_API_URL`.

Full ASC + IAP setup: see [`docs/ASC_Setup.md`](../docs/ASC_Setup.md).

The Pro product id is `com.joelyoung.play4096.pro`. Purchases are verified by posting the StoreKit signed transaction to `/api/v1/iap/apple/verify`.

## CI / TestFlight

- **Mobile CI** (`.github/workflows/MobileCI.yaml`) — lint, typecheck, test, `expo prebuild`, JS bundle on PRs touching `mobile/**`.
- **Mobile Release** (`.github/workflows/MobileRelease.yaml`) — on `main` (or manual): `expo prebuild` → `xcodebuild` archive/export → `altool` upload to TestFlight. Skips cleanly when ASC secrets are missing.
