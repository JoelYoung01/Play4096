import { getUser } from "$lib/server/user";

/** @type {import("./$types").PageServerLoad} */
export function load({ locals }) {
	let user = null;

	if (locals.user) {
		user = getUser(locals.user.id);
	}

	return {
		user,
	};
}
