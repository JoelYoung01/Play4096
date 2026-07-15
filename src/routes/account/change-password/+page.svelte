<script>
	import { enhance } from "$app/forms";
	import { goto } from "$app/navigation";
	import { Alert, AlertDescription } from "$lib/components/ui/alert/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";

	let { form } = $props();

	let loading = $state(false);
	let success = $state(false);

	/** @type {import('./$types').SubmitFunction} */
	function onSubmit() {
		loading = true;

		return async ({ update }) => {
			await update();

			if (form?.success) {
				success = true;
				await new Promise((resolve) => setTimeout(resolve, 2000));
				goto("/account");
			} else {
				loading = false;
			}
		};
	}
</script>

<main class="mx-auto mt-10 w-full max-w-md p-8 pb-28">
	{#if success}
		<Alert class="mb-4">
			<AlertDescription>Password updated successfully</AlertDescription>
		</Alert>
	{/if}
	<h2 class="mb-3 text-2xl font-bold">Change Password</h2>
	<form class="mb-4 block" method="post" action="?/updatePassword" use:enhance={onSubmit}>
		<div class="mb-2 grid gap-2">
			<Label for="currentPassword">Current Password</Label>
			<Input
				id="currentPassword"
				disabled={loading}
				type="password"
				name="currentPassword"
				autocomplete="current-password"
			/>
		</div>
		<div class="mb-2 grid gap-2">
			<Label for="newPassword">New Password</Label>
			<Input
				id="newPassword"
				disabled={loading}
				type="password"
				name="newPassword"
				autocomplete="new-password"
			/>
		</div>

		<p class="text-destructive">{form?.message ?? ""}</p>

		<div class="flex justify-end gap-2">
			<Button href="/account" variant="outline">Cancel</Button>
			<Button type="submit" disabled={loading}>{loading ? "Updating..." : "Update Password"}</Button
			>
		</div>
	</form>
</main>
