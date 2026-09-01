import {
  AUTHED_HOME_HREF,
  GUEST_HOME_HREF,
  authedHomeHref,
  coldStartHref
} from "@/lib/auth-navigation";

describe("authedHomeHref", () => {
  it("sends authed users into the app so OAuth is not stuck on login", () => {
    expect(authedHomeHref("authed")).toBe(AUTHED_HOME_HREF);
    expect(authedHomeHref("guest")).toBeNull();
    expect(authedHomeHref("loading")).toBeNull();
  });
});

describe("coldStartHref", () => {
  it("lands guests in the app instead of the login wall", () => {
    expect(coldStartHref("guest")).toBe(GUEST_HOME_HREF);
    expect(coldStartHref("authed")).toBe(AUTHED_HOME_HREF);
    expect(coldStartHref("loading")).toBeNull();
  });
});
