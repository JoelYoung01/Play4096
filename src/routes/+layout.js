/** @type {import("./$types").LayoutLoad} */
export function load({ data }) {
	// Pass through server-resolved theme data (theme object + picker metadata)
	return data;
}
