const mockExchangeCodeAsync = jest.fn();

jest.mock("expo-auth-session", () => {
  const actual = jest.requireActual("expo-auth-session") as typeof import("expo-auth-session");
  return {
    ...actual,
    exchangeCodeAsync: (...args: unknown[]) => mockExchangeCodeAsync(...args)
  };
});

/* eslint-disable import/first -- jest.mock must be registered before importing the module under test */

import * as AuthSession from "expo-auth-session";
import { Platform } from "react-native";
import { authedHomeHref, AUTHED_HOME_HREF } from "@/lib/auth-navigation";
import {
  exchangeGoogleCodeForIdToken,
  getGoogleAuthCode,
  getGoogleIdToken,
  googleAuthRequestConfig,
  googleIosRedirectUri
} from "@/lib/google-auth";

describe("googleIosRedirectUri", () => {
  it("builds Google's installed-app redirect from an iOS client id", () => {
    expect(googleIosRedirectUri("123-abc.apps.googleusercontent.com")).toBe(
      "com.googleusercontent.apps.123-abc:/oauthredirect"
    );
  });

  it("returns null for missing or malformed ids", () => {
    expect(googleIosRedirectUri("")).toBeNull();
    expect(googleIosRedirectUri(undefined)).toBeNull();
    expect(googleIosRedirectUri("not-a-google-client")).toBeNull();
  });
});

describe("getGoogleIdToken", () => {
  it("reads id_token from params", () => {
    expect(getGoogleIdToken({ type: "success", params: { id_token: "jwt" } })).toBe("jwt");
  });

  it("falls back to authentication.idToken", () => {
    expect(
      getGoogleIdToken({ type: "success", params: {}, authentication: { idToken: "from-auth" } })
    ).toBe("from-auth");
  });

  it("returns null when the credential is missing", () => {
    expect(getGoogleIdToken({ type: "success", params: { code: "abc" } })).toBeNull();
    expect(getGoogleIdToken({ type: "cancel" })).toBeNull();
    expect(getGoogleIdToken(null)).toBeNull();
  });
});

describe("getGoogleAuthCode", () => {
  it("reads the authorization code from a success response", () => {
    expect(getGoogleAuthCode({ type: "success", params: { code: "auth-code" } })).toBe("auth-code");
  });
});

describe("authedHomeHref", () => {
  it("sends authed users into the app so OAuth is not stuck on login", () => {
    expect(authedHomeHref("authed")).toBe(AUTHED_HOME_HREF);
    expect(authedHomeHref("guest")).toBeNull();
    expect(authedHomeHref("loading")).toBeNull();
  });
});

describe("googleAuthRequestConfig", () => {
  it("uses the reversed-client-id redirect and disables silent code exchange on iOS", () => {
    const iosClientId = "123-abc.apps.googleusercontent.com";
    const config = googleAuthRequestConfig({ iosClientId, webClientId: "" });
    expect(config.shouldAutoExchangeCode).toBe(false);
    if (Platform.OS === "ios") {
      expect(config.redirectUri).toBe("com.googleusercontent.apps.123-abc:/oauthredirect");
      expect(config.responseType).toBe(AuthSession.ResponseType.Code);
    }
  });
});

describe("exchangeGoogleCodeForIdToken", () => {
  beforeEach(() => {
    mockExchangeCodeAsync.mockReset();
  });

  it("returns the id token from Google's token endpoint", async () => {
    mockExchangeCodeAsync.mockResolvedValue({
      idToken: "jwt",
      accessToken: "access",
      tokenType: "bearer"
    });
    await expect(
      exchangeGoogleCodeForIdToken({
        clientId: "123-abc.apps.googleusercontent.com",
        code: "auth-code",
        redirectUri: "com.googleusercontent.apps.123-abc:/oauthredirect",
        codeVerifier: "verifier"
      })
    ).resolves.toBe("jwt");
    expect(mockExchangeCodeAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: "123-abc.apps.googleusercontent.com",
        code: "auth-code",
        extraParams: { code_verifier: "verifier" }
      }),
      expect.objectContaining({ tokenEndpoint: "https://oauth2.googleapis.com/token" })
    );
  });

  it("throws when Google omits the id token", async () => {
    mockExchangeCodeAsync.mockResolvedValue({
      accessToken: "access",
      tokenType: "bearer"
    });
    await expect(
      exchangeGoogleCodeForIdToken({
        clientId: "123-abc.apps.googleusercontent.com",
        code: "auth-code",
        redirectUri: "com.googleusercontent.apps.123-abc:/oauthredirect"
      })
    ).rejects.toThrow("Google sign-in did not return a credential.");
  });
});
