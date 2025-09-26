<script>
	import { enhance } from "$app/forms";
	import Btn from "$lib/components/Btn.svelte";

	/** @type {import('./$types').PageData} */
	export let data;
	/** @type {import('./$types').ActionData} */
	export let form;
</script>

<main class="mx-auto mt-10 w-full max-w-md p-8">
	<h1 class="mb-3 text-3xl font-bold">Verify your email address</h1>
	<p class="mb-4">We sent an 8-digit code to {data.email}.</p>
	<form class="mb-1 block" method="post" use:enhance action="?/verify">
		<label class="mb-2 block">
			Code
			<input
				required
				name="code"
				class="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
			/>
		</label>
		<Btn class="px-4 py-2">Verify</Btn>
		<p class="text-red-500">{form?.verify?.message ?? ""}</p>
	</form>
	<form class="mb-4 block" method="post" use:enhance action="?/resend">
		<Btn class="px-4 py-2">Resend code</Btn>
		<p class="text-red-500">{form?.resend?.message ?? ""}</p>
	</form>
	<Btn class="px-4 py-2" href="/account/edit-details">Change your email</Btn>
</main>
