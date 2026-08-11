# App Store Connect setup (TestFlight)

One-time Apple + GitHub config so `.github/workflows/MobileRelease.yaml` can sign and upload to TestFlight. Same secrets as Sous Kit / Jamez — reuse them if you already ship those apps.

## Identifiers

| What | ID | Notes |
|---|---|---|
| **iOS app bundle** (signing / Google / Sign in with Apple) | `com.joelyoung.4096` | Must match the Google iOS OAuth client’s bundle id |
| **Pro IAP product** | `com.joelyoung.4096.pro` | Non-consumable **under** that app in ASC → Monetization → In-App Purchases |

Older ids (`com.joelyoung.play4096*`) are retired; leave any leftover Dev Portal App IDs alone.

## 1. Apple side

1. **Apple Developer Program** — active membership ($99/yr): https://developer.apple.com/programs/
2. **ASC API key** — [Users and Access → Integrations → App Store Connect API](https://appstoreconnect.apple.com/access/integrations/api) → **Team key**, role **Admin**.
   - Save **Key ID**, **Issuer ID**, and the `.p8` (downloadable once).
   - Admin is required for Xcode cloud signing.
3. **App ID** — register `com.joelyoung.4096` under [Identifiers](https://developer.apple.com/account/resources/identifiers/list) with **Sign in with Apple** enabled.
4. **App Store Connect app** — [Apps → + → New App](https://appstoreconnect.apple.com/apps): iOS, name **Play4096** (or similar), bundle ID `com.joelyoung.4096`, SKU e.g. `play4096`.
   - ASC API keys **cannot create apps** (only GET/UPDATE). CI looks up this record and passes `--apple-id` to `altool`.
5. **In-App Purchase** — create a non-consumable `com.joelyoung.4096.pro` (Play4096 Pro) on that app.
6. **Team ID** — [Membership](https://developer.apple.com/account#MembershipDetailsCard) → 10-char string.

## 2. Google OAuth

1. [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials): **iOS** OAuth client with bundle ID `com.joelyoung.4096`.
2. Store the client id as GitHub secret `GOOGLE_IOS_CLIENT_ID` (already wired into Mobile Release as `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` at prebuild **and** archive).
3. Optional web client → secret `GOOGLE_CLIENT_ID`.
4. On the **backend**, set `GOOGLE_CLIENT_IDS` to the same iOS (and web) client id(s), comma-separated — the API verifies the ID token `aud` against that list.

## 3. GitHub secrets & variables

**Secrets**

| Secret | From |
|---|---|
| `APPLE_TEAM_ID` | Membership → Team ID |
| `ASC_KEY_ID` / `ASC_ISSUER_ID` / `ASC_PRIVATE_KEY` | ASC API key |
| `GOOGLE_IOS_CLIENT_ID` | Google iOS OAuth client |
| `GOOGLE_CLIENT_ID` | Google web OAuth client (optional) |

**Variables**

| Variable | Purpose |
|---|---|
| `PLAY4096_IOS_BUNDLE_ID` | Optional override (default `com.joelyoung.4096`) |
| `MOBILE_API_URL` | Production API origin baked into the JS bundle |

## 4. Backend env (production)

| Env | Purpose |
|---|---|
| `APPLE_CLIENT_ID` | `com.joelyoung.4096` |
| `GOOGLE_CLIENT_IDS` | Same as `GOOGLE_IOS_CLIENT_ID` (+ web if used) |
| `APPLE_IAP_PRODUCT_ID` | `com.joelyoung.4096.pro` |
| `APPLE_IAP_BUNDLE_ID` | `com.joelyoung.4096` |

## 5. Ship

- Auto: push to `main` touching `mobile/**`
- Manual: **Actions → Mobile Release (iOS) → Run workflow**

Without ASC secrets, the job warns and skips (stays green). With them: IPA → TestFlight.
