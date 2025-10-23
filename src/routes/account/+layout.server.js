import { requireLoginProfile } from "$lib/server/user";

/** @type {import("./$types").LayoutServerLoad} */
export async function load() {
	const userProfile = requireLoginProfile();
	return { userProfile };
}
