import { requireLogin } from "$lib/server/user";

export const load = async () => {
	const user = requireLogin();
	return { user };
};
