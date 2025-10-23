<script>
	import { enhance } from "$app/forms";
	import Btn from "$lib/components/Btn.svelte";
	import { SUPPORT_EMAIL } from "$lib/constants";

	/** @type {import('./$types').PageProps} */
	let { form } = $props();
</script>

<main class="mx-auto mt-10 w-full max-w-md p-8">
	<h1 class="text-3xl font-bold">Forgot your password?</h1>
	<div class="mb-1 flex items-center gap-2">
		Contact Support:
		<a
			class="text-blue-500 hover:underline"
			href={`mailto:${SUPPORT_EMAIL}?subject=Forgot Password Assistance`}>{SUPPORT_EMAIL}</a
		>
	</div>
	<form class="mb-2 block" method="post" use:enhance>
		<label class="mb-2 block">
			Email
			<input
				type="email"
				name="email"
				required
				value={form?.email ?? ""}
				class="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
			/>
		</label>
		<Btn class="px-4 py-2">Send</Btn>
		<p class="text-red-500">{form?.message ?? ""}</p>
	</form>
	<Btn class="px-4 py-2" href="/login">Back to Login</Btn>
</main>
