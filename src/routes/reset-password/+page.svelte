<script>
	import { enhance } from "$app/forms";
	import Btn from "$lib/components/Btn.svelte";

	/** @type {import("./$types").ActionData} */
	export let form;
</script>

<main class="mx-auto mt-10 w-full max-w-md p-8">
	<h1 class="mb-3 text-3xl font-bold">Enter your new password</h1>
	<form method="post" use:enhance>
		<label class="mb-2 block">
			Password

			<input
				required
				type="password"
				name="password"
				autocomplete="new-password"
				class="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
			/>
		</label>
		<Btn class="px-4 py-2">Reset password</Btn>
		<p class="text-red-500">{form?.message ?? ""}</p>
	</form>
</main>
