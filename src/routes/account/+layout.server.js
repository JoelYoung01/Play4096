import { redirect } from "@sveltejs/kit";
import { getRequestEvent } from "$app/server";

export const load = async () => {
	const user = requireLogin();
	return { user };
};

function requireLogin() {
	const { locals, url } = getRequestEvent();

	if (!locals.user) {
		return redirect(302, `/login?redirectTo=${url.pathname}`);
	}

	return locals.user;
}
