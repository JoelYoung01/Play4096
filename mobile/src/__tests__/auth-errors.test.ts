import { loginWithApple, loginWithGoogle } from "@/api/auth";
import { alertOnce, resetAlertOnceForTests } from "@/lib/alert";
import { friendlyAuthNetworkError } from "@/lib/auth-errors";
import { Alert } from "react-native";

describe("friendlyAuthNetworkError", () => {
  it("rewrites Expo connection failures into a clear message", () => {
    expect(
      friendlyAuthNetworkError(
        "fetch failed: UnexpectedException: Could not connect to the server. (at ExpoModulesCore/Promise.swift:56)"
      )
    ).toBe("Could not reach the server. Check your connection and API URL, then try again.");
  });

  it("leaves unrelated auth errors intact", () => {
    expect(friendlyAuthNetworkError("access_denied")).toBe("access_denied");
  });

  it("preserves host-aware Could not reach messages", () => {
    expect(friendlyAuthNetworkError("Could not reach play-4096.com. Check your connection and try again.")).toBe(
      "Could not reach play-4096.com. Check your connection and try again."
    );
  });
});

describe("alertOnce", () => {
  const alertSpy = jest.spyOn(Alert, "alert");

  beforeEach(() => {
    resetAlertOnceForTests();
    alertSpy.mockClear();
  });

  afterAll(() => {
    alertSpy.mockRestore();
  });

  it("dedupes identical alerts within the window", () => {
    alertOnce("Apple sign-in", "Network error");
    alertOnce("Apple sign-in", "Network error");
    alertOnce("Apple sign-in", "Network error");
    expect(alertSpy).toHaveBeenCalledTimes(1);
  });

  it("allows a different message through", () => {
    alertOnce("Apple sign-in", "Network error");
    alertOnce("Apple sign-in", "Something else");
    expect(alertSpy).toHaveBeenCalledTimes(2);
  });
});

describe("oauth login network failures", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("maps Google fetch failures to a host-aware AuthApiError message", async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError("Network request failed")) as typeof fetch;
    await expect(loginWithGoogle({ credential: "token" })).rejects.toMatchObject({
      name: "AuthApiError",
      status: 503,
      userMessage: expect.stringMatching(/^Could not reach .+\. Check your connection and try again\.$/)
    });
  });

  it("maps Apple fetch failures to a host-aware AuthApiError message", async () => {
    global.fetch = jest.fn().mockRejectedValue(
      new TypeError(
        "fetch failed: UnexpectedException: Could not connect to the server. (at ExpoModulesCore/Promise.swift:56)"
      )
    ) as typeof fetch;
    await expect(loginWithApple({ identity_token: "token" })).rejects.toMatchObject({
      name: "AuthApiError",
      status: 503,
      userMessage: expect.stringMatching(/^Could not reach .+\. Check your connection and try again\.$/)
    });
  });
});
