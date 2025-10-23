<script>
	import { enhance } from "$app/forms";
	import { goto } from "$app/navigation";
	import Btn from "$lib/components/Btn.svelte";
	import { LoaderCircleIcon } from "@lucide/svelte";

	/** @type {import("./$types").PageProps} */
	let { data, form } = $props();

	let loading = $state(false);

	/** @type {import("./$types").SubmitFunction} */
	function onSubmit() {
		loading = true;

		return async ({ result, update }) => {
			if (result.type === "redirect") {
				goto(result.location);
			} else {
				await update();
				loading = false;
			}
		};
	}
</script>

<main class="mx-auto mt-10 w-full max-w-md p-8">
	<h1 class="text-3xl font-bold">Verify Email</h1>
	<p class="mb-2 text-sm text-gray-500">We've sent a 8-digit code to {data.email}.</p>
	<form method="post" use:enhance={onSubmit}>
		<label class="mb-2 block">
			Code
			<input
				required
				name="code"
				autocomplete="one-time-code"
				class="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
			/>
		</label>
		<Btn class="px-4 py-2" disabled={loading}>
			{#if loading}
				<div class="flex items-center justify-center gap-2">
					<LoaderCircleIcon class="animate-spin" size={16} />
					Verifying...
				</div>
			{:else}
				Verify
			{/if}
		</Btn>
		<p class="text-red-500">{form?.message ?? ""}</p>
	</form>
</main>
