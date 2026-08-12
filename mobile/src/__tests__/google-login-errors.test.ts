import { friendlyGoogleError } from "@/components/GoogleLoginButton";
import { loginWithGoogle } from "@/api/auth";

describe("friendlyGoogleError", () => {
  it("rewrites Expo connection failures into a clear message", () => {
    expect(
      friendlyGoogleError(
        "fetch failed: UnexpectedException: Could not connect to the server. (at ExpoModulesCore/Promise.swift:56)"
      )
    ).toBe("Could not reach the server. Check your connection and API URL, then try again.");
  });

  it("leaves unrelated Google errors intact", () => {
    expect(friendlyGoogleError("access_denied")).toBe("access_denied");
  });
});

describe("loginWithGoogle network failures", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("maps fetch failures to a stable AuthApiError message", async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError("Network request failed")) as typeof fetch;
    await expect(loginWithGoogle({ credential: "token" })).rejects.toMatchObject({
      name: "AuthApiError",
      status: 503,
      userMessage: "Network error. Check your connection and try again."
    });
  });
});
