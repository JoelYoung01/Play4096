import { requireLoginProfile } from "$lib/server/user";

export const load = async () => {
	const user = requireLoginProfile();
	return { user };
};
