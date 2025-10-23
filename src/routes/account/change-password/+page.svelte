<script>
	import { enhance } from "$app/forms";
	import Btn from "$lib/components/Btn.svelte";
	import { goto } from "$app/navigation";
	import Alert from "$lib/components/Alert.svelte";

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

<main class="mx-auto mt-10 w-full max-w-md p-8">
	{#if success}
		<Alert type="success" duration={3000}>
			<div>Password updated successfully</div>
		</Alert>
	{/if}
	<h2 class="mb-3 text-2xl font-bold">Change Password</h2>
	<form class="mb-4 block" method="post" action="?/updatePassword" use:enhance={onSubmit}>
		<label class="mb-2 block">
			Current Password
			<input
				disabled={loading}
				type="password"
				name="currentPassword"
				autocomplete="current-password"
				class="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
			/>
		</label>
		<label class="mb-2 block">
			New Password
			<input
				disabled={loading}
				type="password"
				name="newPassword"
				autocomplete="new-password"
				class="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
			/>
		</label>

		<p class="text-red-500">{form?.message ?? ""}</p>

		<div class="flex justify-end gap-2">
			<Btn class="px-4 py-2" href="/account">Cancel</Btn>
			<Btn class="px-4 py-2" disabled={loading}>{loading ? "Updating..." : "Update Password"}</Btn>
		</div>
	</form>
</main>
