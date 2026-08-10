# App Store Connect setup (TestFlight)

One-time Apple + GitHub config so `.github/workflows/MobileRelease.yaml` can sign and upload to TestFlight. Same secrets as Sous Kit / Jamez — reuse them if you already ship those apps.

## Identifiers (important)

| What | ID | Notes |
|---|---|---|
| **iOS app bundle** | `com.joelyoung.play4096.pro` | Matches the existing ASC app **“4096: A Tile Game”** |
| **Pro IAP product** | `com.joelyoung.play4096.pro.unlock` | Non-consumable **under** that app (create in ASC → Monetization → In-App Purchases) |
| Dev Portal App ID `com.joelyoung.play4096` | (XC auto) | From cloud signing; not the ASC app record |

The `.pro` suffix on the **app** bundle is historical (the ASC listing was created with that id). It is **not** the IAP product — the product id is `….pro.unlock`.

## 1. Apple side

1. **Apple Developer Program** — active membership ($99/yr): https://developer.apple.com/programs/
2. **ASC API key** — [Users and Access → Integrations → App Store Connect API](https://appstoreconnect.apple.com/access/integrations/api) → **Team key**, role **Admin**.
   - Save **Key ID**, **Issuer ID**, and the `.p8` (downloadable once).
   - Admin is required for Xcode cloud signing. App Manager → `"Cloud signing permission error"`.
3. **App record** — already present as **4096: A Tile Game** (`com.joelyoung.play4096.pro`). CI looks this up and passes `--apple-id` to `altool`. (ASC API keys cannot *create* apps — only GET/UPDATE.)
4. **Sign in with Apple** — enable on App ID `com.joelyoung.play4096.pro`.
5. **In-App Purchase** — create a non-consumable `com.joelyoung.play4096.pro.unlock` (Play4096 Pro).
6. **Team ID** — [Membership](https://developer.apple.com/account#MembershipDetailsCard) → 10-char string.

No need to create/export certs or profiles by hand — the workflow uses cloud-managed signing at export time.

## 2. GitHub secrets & variables

**Settings → Secrets and variables → Actions → Secrets**

| Secret | From |
|---|---|
| `APPLE_TEAM_ID` | Membership → Team ID |
| `ASC_KEY_ID` | API key → Key ID |
| `ASC_ISSUER_ID` | API key → Issuer ID |
| `ASC_PRIVATE_KEY` | Full `.p8` contents (multiline OK) |
| `GOOGLE_CLIENT_ID` | Google OAuth web client id (optional) |
| `GOOGLE_IOS_CLIENT_ID` | Google OAuth iOS client id (optional) |

**Variables**

| Variable | Purpose |
|---|---|
| `PLAY4096_IOS_BUNDLE_ID` | Optional override (default `com.joelyoung.play4096.pro`) |
| `MOBILE_API_URL` | Production API origin baked into the JS bundle |

Build number = `github.run_number`.

## 3. Backend env (production)

Set on the server / deploy environment:

| Env | Purpose |
|---|---|
| `APPLE_CLIENT_ID` | Sign in with Apple audience (= app bundle id) |
| `GOOGLE_CLIENT_IDS` | Comma-separated Google client ids accepted as token `aud` |
| `APPLE_IAP_PRODUCT_ID` | `com.joelyoung.play4096.pro.unlock` |
| `APPLE_IAP_BUNDLE_ID` | `com.joelyoung.play4096.pro` |

## 4. Ship

- Auto: push to `main` touching `mobile/**`
- Manual: **Actions → Mobile Release (iOS) → Run workflow**

Without the ASC secrets, the job warns and skips (stays green). With them: IPA → TestFlight (plus a workflow artifact).

Then: TestFlight app on phone → App Store Connect → TestFlight → add yourself as internal tester → install.
