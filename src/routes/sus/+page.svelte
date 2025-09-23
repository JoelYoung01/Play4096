<script>
	import { browser } from "$app/environment";

	async function handleSus() {
		const query = new URLSearchParams(window.location.search);
		const from = query.get("redirectFrom");

		const response = await fetch("/sus", {
			method: "POST",
			body: JSON.stringify({
				from,
			}),
		});
		const data = await response.json();

		if (data.redirectUrl) {
			window.location.href = data.redirectUrl;
		}
	}

	if (browser) {
		handleSus();
	}
</script>

<h1>You are sus. Look at this ad.</h1>
<div class="ad">
	<h2>Ad</h2>
</div>
