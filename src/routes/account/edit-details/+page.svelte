<script>
	import { enhance } from "$app/forms";
	import { goto } from "$app/navigation";
	import Btn from "$lib/components/Btn.svelte";
	import Alert from "$lib/components/Alert.svelte";
	import { slide } from "svelte/transition";

	const SUCCESS_DURATION = 2000;

	let { data, form } = $props();

	let loading = $state(false);
	let formData = $state({ ...data.formData });
	let showSuccess = $state(false);

	/** @type {import('./$types').SubmitFunction} */
	function onSubmit() {
		loading = true;

		return async ({ update }) => {
			await update();
			formData = { ...formData, ...form };

			if (form?.success) {
				showSuccess = true;
				await new Promise((resolve) => setTimeout(resolve, SUCCESS_DURATION));
				goto("/account");
			} else {
				loading = false;
			}
		};
	}
</script>

<main class="mx-auto mt-10 w-full max-w-md p-8">
	<Alert type="success" duration={SUCCESS_DURATION} bind:show={showSuccess}>
		<div>Details updated successfully</div>
	</Alert>
	<div class=" mb-3 flex items-end justify-between gap-2">
		<h1 class="text-3xl font-bold">Edit Details</h1>
	</div>
	<form class="mb-4 block" method="post" action="?/editDetails" use:enhance={onSubmit}>
		<label class="mb-2 block">
			Display Name
			<input
				name="displayName"
				disabled={loading}
				bind:value={formData.displayName}
				class="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
			/>
		</label>

		<label class="block">
			Email
			{#if data.user.emailVerified}
				<span class="text-green-500">(Verified)</span>
			{:else}
				<span class="text-red-500">(Unverified)</span>
			{/if}
			<input
				name="email"
				disabled={loading}
				bind:value={formData.email}
				class="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
			/>
		</label>

		{#if form?.message}
			<p transition:slide class="text-red-500">{form.message}</p>
		{/if}

		<div class="mt-2 flex justify-end gap-2">
			<Btn class="px-4 py-2" href="/account">Cancel</Btn>
			<Btn class="px-4 py-2" disabled={loading}>{loading ? "Saving..." : "Save"}</Btn>
		</div>
	</form>
</main>
