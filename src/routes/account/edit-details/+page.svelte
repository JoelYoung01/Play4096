<script>
	import { enhance } from "$app/forms";
	import { goto } from "$app/navigation";
	import { Alert, AlertDescription } from "$lib/components/ui/alert/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
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

<main class="mx-auto mt-10 w-full max-w-md p-8 pb-28">
	{#if showSuccess}
		<Alert class="mb-4">
			<AlertDescription>Details updated successfully</AlertDescription>
		</Alert>
	{/if}
	<div class=" mb-3 flex items-end justify-between gap-2">
		<h1 class="text-3xl font-bold">Edit Details</h1>
	</div>
	<form class="mb-4 block" method="post" action="?/editDetails" use:enhance={onSubmit}>
		<div class="mb-2 grid gap-2">
			<Label for="displayName">Display Name</Label>
			<Input
				id="displayName"
				type="text"
				name="displayName"
				disabled={loading}
				bind:value={formData.displayName}
			/>
		</div>

		<div class="grid gap-2">
			<div class="flex items-center gap-2">
				<Label for="email">Email</Label>
				{#if data.userProfile.emailVerified}
					<span class="text-sm text-primary">(Verified)</span>
				{:else}
					<span class="text-sm text-destructive">(Unverified)</span>
				{/if}
			</div>
			<Input id="email" type="text" name="email" disabled={loading} bind:value={formData.email} />
		</div>

		{#if form?.message}
			<p transition:slide class="text-destructive">{form.message}</p>
		{/if}

		<div class="mt-2 flex justify-end gap-2">
			<Button href="/account" variant="outline">Cancel</Button>
			<Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
		</div>
	</form>
</main>
