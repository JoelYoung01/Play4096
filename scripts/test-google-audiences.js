import assert from "node:assert/strict";
import { resolveGoogleAudiences } from "../src/lib/server/mobile/googleAudiences.js";

assert.deepEqual(resolveGoogleAudiences({}), []);

assert.deepEqual(resolveGoogleAudiences({ GOOGLE_CLIENT_IDS: "ios.apps.googleusercontent.com, web.apps.googleusercontent.com" }), [
	"ios.apps.googleusercontent.com",
	"web.apps.googleusercontent.com"
]);

assert.deepEqual(
	resolveGoogleAudiences({
		GOOGLE_IOS_CLIENT_ID: "ios.apps.googleusercontent.com",
		GOOGLE_CLIENT_ID: "web.apps.googleusercontent.com"
	}),
	["ios.apps.googleusercontent.com", "web.apps.googleusercontent.com"]
);

assert.deepEqual(
	resolveGoogleAudiences({
		GOOGLE_CLIENT_IDS: "ios.apps.googleusercontent.com",
		GOOGLE_IOS_CLIENT_ID: "ios.apps.googleusercontent.com",
		GOOGLE_CLIENT_ID: "web.apps.googleusercontent.com"
	}),
	["ios.apps.googleusercontent.com", "web.apps.googleusercontent.com"]
);

assert.deepEqual(resolveGoogleAudiences({ GOOGLE_CLIENT_IDS: " , , " }), []);

console.log("resolveGoogleAudiences: ok");
